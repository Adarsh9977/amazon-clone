#!/usr/bin/env python3
"""
8x agent-capture hook for Claude Code.

Wired in .claude/settings.json:
  UserPromptSubmit -> `capture.py prompt`    (stdin JSON: prompt, session_id, transcript_path)
  Stop             -> `capture.py response`  (stdin JSON: session_id, transcript_path)

Writes one file per session to .agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md in the
8x format. Captures ONLY the verbatim prompt and the final assistant text of each turn.
Thinking, tool calls, tool results and intermediate assistant text are never written.

Append-only: past entries are never edited. Only the frontmatter counters are refreshed.

Env overrides (all optional):
  AGENT_LOGS_DIR     where logs go          (default: $CLAUDE_PROJECT_DIR/.agent-logs)
  AGENT_LOG_PROJECT  project name in header (default: name of the project dir)
  AGENT_LOG_AUTHOR   github handle          (default: Adarsh9977)
  CAPTURE_DEBUG=1    write hook payload KEYS (never content) to ~/.cache/capture-hook-debug.log
"""
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

AUTHOR = os.environ.get("AGENT_LOG_AUTHOR", "Adarsh9977")
TOOL = "claude-code"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def project_dir() -> Path:
    return Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())


def logs_dir() -> Path:
    d = Path(os.environ["AGENT_LOGS_DIR"]) if os.environ.get("AGENT_LOGS_DIR") else project_dir() / ".agent-logs"
    d.mkdir(parents=True, exist_ok=True)
    return d


def project_name() -> str:
    return os.environ.get("AGENT_LOG_PROJECT") or project_dir().name


def session_id_of(payload: dict) -> str:
    # The transcript file name is the stable conversation id across CLI restarts/resumes.
    tp = payload.get("transcript_path")
    if tp:
        return Path(tp).stem
    return payload.get("session_id") or "unknown-session"


def session_file(session_id: str) -> Path:
    for p in sorted(logs_dir().glob(f"*_{session_id}.md")):
        return p
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    date = stamp[:10]
    p = logs_dir() / f"{stamp}_{session_id}.md"
    p.write_text(
        "---\n"
        f"session_id: {session_id}\n"
        f"date: {date}\n"
        f"author: {AUTHOR}\n"
        "model: unknown\n"
        f"tool: {TOOL}\n"
        f"project: {project_name()}\n"
        "total_exchanges: 0\n"
        "first_prompt_time: \n"
        "last_prompt_time: \n"
        "---\n\n"
        f"# Session Log - {date}\n\n"
        f"Session: `{session_id[:8]}` | Project: `{project_name()}` | Author: `{AUTHOR}`\n\n"
        "---\n\n",
        encoding="utf-8",
    )
    return p


FM = re.compile(r"---\n(.*?)\n---\n", re.S)


def read_meta(text: str) -> dict:
    m = FM.match(text)
    meta = {}
    if m:
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return meta


def write_meta(path: Path, updates: dict) -> None:
    text = path.read_text(encoding="utf-8")
    m = FM.match(text)
    if not m:
        return
    out = []
    for line in m.group(1).splitlines():
        k = line.partition(":")[0].strip()
        out.append(f"{k}: {updates[k]}" if k in updates else line)
    path.write_text("---\n" + "\n".join(out) + "\n---\n" + text[m.end():], encoding="utf-8")


def nums(text: str, kind: str) -> list:
    return [int(n) for n in re.findall(rf"\[LOG_ENTRY type={kind} num=(\d+) ", text)]


def append_entry(path: Path, kind: str, num: int, sid: str, model: str, body: str, ts: str) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(f"[LOG_ENTRY type={kind} num={num} session={sid[:8]}]\n")
        f.write(f"timestamp: {ts}\n")
        f.write(f"model: {model}\n\n")
        f.write(body.rstrip("\n") + "\n\n\n")


def transcript_lines(path: str) -> list:
    out = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except (OSError, TypeError):
        pass
    # main thread only; subagent (sidechain) lines are not the user's conversation
    return [o for o in out if not o.get("isSidechain")]


def last_model(lines: list) -> str:
    for o in reversed(lines):
        if o.get("type") == "assistant":
            m = (o.get("message") or {}).get("model")
            if m and not m.startswith("<"):
                return m
    return "unknown"


META_PREFIXES = ("<local-command", "<command-name", "<command-message", "<system-reminder")


def _user_kind(o: dict) -> str:
    """Classify a transcript `user` line: 'tool_result', 'prompt', or 'meta'."""
    content = (o.get("message") or {}).get("content")
    if isinstance(content, list) and any(isinstance(b, dict) and b.get("type") == "tool_result" for b in content):
        return "tool_result"
    if o.get("isMeta"):
        return "meta"
    if isinstance(content, list):
        content = "\n".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
    if not isinstance(content, str) or content.lstrip().startswith(META_PREFIXES):
        return "meta"  # slash-command echoes, system reminders, hook feedback
    return "prompt"


def _texts(o: dict) -> list:
    content = (o.get("message") or {}).get("content")
    if isinstance(content, str):
        return [content] if content.strip() else []
    return [b["text"] for b in content or [] if isinstance(b, dict) and b.get("type") == "text" and b.get("text", "").strip()]


def final_response(lines: list):
    """
    Final response of the turn = the trailing run of assistant text blocks, read backwards
    from the end of the transcript until the last real prompt or tool result.

    This harness writes each content block of a message as its own transcript line, and
    slash commands (/model etc.) add user-type meta lines, so a naive "after the last user
    line" rule loses the reply. Thinking and tool_use blocks are skipped.
    """
    collected, model = [], None
    for o in reversed(lines):
        t = o.get("type")
        if t == "assistant":
            texts = _texts(o)
            if texts:
                collected = texts + collected
                model = model or (o.get("message") or {}).get("model")
            continue
        if t == "user":
            kind = _user_kind(o)
            if kind in ("tool_result", "prompt") or collected:
                break
        # attachments, system, queue-operation, and pre-reply meta lines: skip
    body = "\n\n".join(x.strip("\n") for x in collected) if collected else "(no text response this turn)"
    return body, model


def debug(kind: str, payload: dict) -> None:
    if os.environ.get("CAPTURE_DEBUG") != "1":
        return
    p = Path.home() / ".cache" / "capture-hook-debug.log"
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a") as f:
        f.write(f"{now_iso()} {kind} keys={sorted(payload.keys())} logs_dir={logs_dir()}\n")


def main() -> int:
    kind = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}
    debug(kind, payload)

    sid = session_id_of(payload)
    path = session_file(sid)
    text = path.read_text(encoding="utf-8")
    meta = read_meta(text)
    ts = now_iso()
    lines = transcript_lines(payload.get("transcript_path", ""))

    if kind == "prompt":
        model = payload.get("model") or last_model(lines)
        if model == "unknown" and meta.get("model") not in (None, "", "unknown"):
            model = meta["model"]
        num = max(nums(text, "PROMPT"), default=0) + 1
        append_entry(path, "PROMPT", num, sid, model, payload.get("prompt", ""), ts)
        write_meta(path, {
            "total_exchanges": str(num),
            "first_prompt_time": meta.get("first_prompt_time") or ts,
            "last_prompt_time": ts,
            "model": model,
        })

    elif kind == "response":
        prompt_num = max(nums(text, "PROMPT"), default=0)
        if prompt_num == 0:
            return 0  # hook installed mid-turn: no prompt on record, don't write an orphan
        body, model = final_response(lines)
        model = model or meta.get("model", "unknown")
        # Stop can fire more than once per turn (another Stop hook may continue the turn).
        # Write each distinct final text; skip exact duplicates of what's already logged for this prompt.
        existing = re.findall(
            rf"\[LOG_ENTRY type=RESPONSE num={prompt_num} [^\]]*\]\ntimestamp: [^\n]*\nmodel: [^\n]*\n\n(.*?)\n\n\n",
            text, re.S,
        )
        if body.rstrip("\n") in [e.rstrip("\n") for e in existing]:
            return 0
        append_entry(path, "RESPONSE", prompt_num, sid, model, body, ts)
        write_meta(path, {"model": model})

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # logging must never block the agent
        sys.stderr.write(f"[capture hook] {e}\n")
        sys.exit(0)
