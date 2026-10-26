# CAPTURE-TEST

Status: **PENDING** — hook installed and committed, canaries not yet run.

## 1. Tool and model

| | |
| --- | --- |
| Tool | Claude Code CLI on macOS (arm64), run from this repo's root |
| Model | `claude-opus-5-5` <!-- confirm with /model in the local session --> for planning and execution. The model is read from the session transcript on every turn and written on every log entry, so a switch is visible. |
| Hook mechanism available? | Yes. Claude Code lifecycle hooks: `UserPromptSubmit` (fires on every prompt, prompt text on stdin) and `Stop` (fires at end of every turn, `transcript_path` on stdin). |

Earlier setup session: the repo, hook and plan were created in a cloud Claude session (Claude app, Claude Code harness v2.1.285). Planning ran on `claude-fable-5-1` before the hook existed, so those turns are not in `.agent-logs/`; their outputs are in `docs/`. Setup ran on `claude-opus-5-5` with the hook live from mid-session; that log is the first file in `.agent-logs/`. Work moved to local Claude Code because the cloud session couldn't create a GitHub repo.

## 2. Mechanism and config files changed

| File | Purpose |
| --- | --- |
| `.claude/settings.json` (committed) | Wires `UserPromptSubmit` → `capture.py prompt` and `Stop` → `capture.py response` via `$CLAUDE_PROJECT_DIR`. Fires for any Claude Code session started in this repo. |
| `.claude/hooks/capture.py` (committed) | Appends to `.agent-logs/<UTC>_<session-id>.md` in the 8x format. Prompt verbatim. Final response = the trailing assistant text blocks of the turn; thinking, tool calls, tool results and mid-turn text are never written. Append-only; only frontmatter counters are refreshed. Exits 0 on any error so it never blocks the agent. |

Session id = the transcript file name, which stays stable if the CLI is relaunched or resumed.

## 3. Log file paths

- Canary 1 (local session 1): `.agent-logs/<pending>`
- Canary 2 (local session 2): `.agent-logs/<pending>`

## 4. Canary entries, raw

### Session 1

```
<pending>
```

### Session 2

```
<pending>
```

## 5. What I tried first that did not work

1. **Response extraction took the last transcript line with text.** The cloud harness writes each content block of an assistant message as its own JSONL line, so a reply split across blocks would have been cut to its last block. Changed to gather the whole trailing run of text blocks.
2. **"Everything after the last user line" logged replies as empty.** Tested on a copy of the real transcript: running `/model` writes `user`-type lines (`<local-command-caveat>`, `<command-name>`, a `<system-reminder>`) after the reply, so the log said `(no text response this turn)`. Fixed by reading backwards from the end, skipping slash-command and system-reminder lines, stopping at a real prompt or tool result. Re-tested across two simulated sessions: full replies, no tool or thinking content, duplicate `Stop` events skipped.
3. **Repo hooks didn't load in the cloud session**, because Claude Code takes project settings from the session's working directory (the repo's parent there). Worked around it with a delegating settings file in the parent for that session only. Locally, `claude` runs from the repo root, so the committed config is used directly.
4. **A Stop hook installed mid-turn would write a response with no prompt.** The script now skips a response when no prompt is on record for the session. You can see this in the cloud log: the file was created at the first Stop with no entries, and entries start at the next prompt.
5. **The cloud session couldn't create the GitHub repo** (not a capture problem, but it's why the canaries ran locally): repo creation was refused, and the session's GitHub access only covers repos that already exist.
6. **Cloud-session prompts include harness-injected `<system-reminder>` lines** (timezone/time) ahead of the typed text. They're logged as received, not stripped, because the brief asks for the prompt verbatim.
