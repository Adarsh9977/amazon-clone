# CLAUDE.md — amazon-clone

Context for any Claude Code session in this repo. Read this first, then `docs/`.

## What this is

Adarsh's (GitHub `Adarsh9977`) take-home for the 8x Product Engineer role: rebuild amazon.com. Full brief: `docs/brief.md`.

- Window: 24 hours, tracked not enforced. Judged on **speed** (working product in the time), **product judgement** (what was built first, what was left out), **UX/UI**.
- Hand in: a live link that works signed-out, a **public** repo with `.agent-logs/` committed, and a ≤5 min walkthrough video with camera on.
- The brief also requires real recon first: sign up on amazon.com, go through every flow end to end, take screenshots. Screenshots go in `recon/`.

## Non-negotiables

1. **Agent capture.** `.claude/settings.json` hooks run `.claude/hooks/capture.py` on every prompt (`UserPromptSubmit`) and end of turn (`Stop`), appending to `.agent-logs/<UTC>_<session>.md`. Never edit or delete log entries, never gitignore `.agent-logs/`. Spec: `docs/8x-capture-setup.md`.
2. **Commit small and often**, logs included, so commit order shows the real order of work. Each feature = its own commit.
3. **No building until `CAPTURE-TEST.md` is green** (two canaries in two separate sessions, pasted raw).
4. Dead ends stay in the record. Don't tidy history.

## Status (2026-10-26, 09:05 UTC)

Done, in an earlier cloud Claude session (claude-fable-5-1 for planning, claude-opus-5-5 for setup):
- Chose Amazon of the three briefs (Higgsfield, Amazon, Fanthom). Claude recommended Fanthom as safest; Adarsh picked Amazon for depth and risk. That trade-off is the core product-judgement story.
- Spec, architecture, live-site recon of the UI, final data model, seed data, capture hook. All in `docs/`.
- Capture hook verified firing in that cloud session (its log is in `.agent-logs/`). That session could not create a GitHub repo (its GitHub access is limited to existing repos), which is why work moved here.

**Next, in order:**
1. Canary 1: user sends `CAPTURE TEST — 8x assignment, Adarsh Tiwari`. Confirm a PROMPT and RESPONSE land in a new file in `.agent-logs/`.
2. User exits (`/exit`), starts `claude` again, sends the canary again. Confirm a second file.
3. Fill the canary sections of `CAPTURE-TEST.md` (paste raw), set Status to PASSED, commit.
4. `gh repo create Adarsh9977/amazon-clone --public --source . --remote origin --push`
5. Recon: Adarsh signs up on amazon.com and walks the flows; screenshots → `recon/`, commit.
6. Build per `docs/spec.md` §10 schedule. Hour 1: scaffold Next.js in this repo root (don't let create-next-app overwrite `.gitignore`, `README.md`, `CLAUDE.md`), Neon + Prisma, seed from `docs/seed/` (see its README), first Vercel deploy.

## Where things are

| Path | What |
| --- | --- |
| `docs/spec.md` | Full product + technical spec: features F1–F18 with acceptance criteria, routes, API, security, QA script, 12h schedule |
| `docs/live-site-findings.md` | 14 details observed on the live site. **Overrides spec.md where they conflict** (page size 16, six sort labels, badges, bought-in-past-month, etc.) |
| `docs/seed/` | Final Prisma schema (**supersedes spec.md §4.1**), 194 real products with CDN images, category tree, deterministic seed script, search migration |
| `docs/brief.md`, `docs/8x-capture-setup.md` | The assignment and capture instructions, verbatim |
| Architecture doc with diagram | https://claude.ai/artifact/Q5YstCUyAwCDf8N1MPXQtV |

## Decisions already made (don't relitigate without reason)

- **Stack:** Next.js 15 App Router + TypeScript, Tailwind v4, Neon Postgres + Prisma, Auth.js v5 (credentials, bcrypt, JWT sessions), Stripe Checkout in test mode + webhook, Zustand for the guest cart, Zod, Vercel.
- **Scope:** P0 = the purchase path (header, home, search with filters, category, PDP, guest cart, auth, cart merge on login, checkout, webhook order creation, order history). P1 = loading/empty/error states, Buy Now, responsive pass, search suggestions, read-only reviews. P2 = posting reviews, wishlist, "customers also bought". Cut order if behind: P2 first, never cut checkout → webhook → orders.
- **Out of scope, stated in README:** real payments, Prime, variants, sponsored results, seller tools, returns, geo gating, ML recommendations.
- **Money:** integer cents everywhere. Tax 8%. Shipping free at ≥ $35, else $5.99. Checkout prices come from the DB, never the client.
- **Search:** Postgres full-text (`tsvector` + GIN), URL params are the single source of truth (`k, cat, brand, min, max, rating, deals, sort, page`).
- **Branding:** text wordmark, never Amazon's logo asset. Palette tokens in spec.md §3.1.
- **Demo login** created by the seed: `demo@example.com` / `password123`.

## Env vars

`DATABASE_URL`, `DIRECT_URL` (Neon), `AUTH_SECRET`, `AUTH_URL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`. Never commit `.env*`.
