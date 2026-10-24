# .sandbox — CONTEXT

The single git-tracked file of `.sandbox/` (see `.gitignore`: bulk ignored,
this map tracked). Self-imposed budget: ≤ 2.5 KiB — it is a *map*, not content.

## The sandbox idea

Every agent-facing repo surface is byte-budgeted (`spec/meta-harness.md` R4:
AGENTS.md · `spec/*.md` · GDD · WORK.md · methodology guide), and the
methodology holds that daily work must never *depend* on sandbox-local paths.
Deep analysis, upstream references and experiments still need to exist
*somewhere* an agent can reach across sessions.

`.sandbox/` is that **external context membrane**:

- **Untracked bulk** — heavy reference & analysis material stays out of git
  history and out of every context budget.
- **Distill down, never import** — conclusions land as thin, self-contained
  contracts in `spec/*.md`; nothing in-repo cites sandbox paths as required
  reading.
- **One tracked map** — this file carries cross-session memory of what lives
  here and where the execution project stands. Should a second entry ever
  become tracked, it needs its own `!.sandbox/<name>` gitignore line.

## Lanes

| Lane | Path | Rule |
|---|---|---|
| reference (read-only) | `references/agentx/` | upstream META HARNESS mirror — study, don't edit |
| analysis | `adapt-meta-harness.md` | living deep analysis; distills into `spec/*.md` |
| out | `out/` | workflow / experiment output, disposable; created on first use |

## Project — "adapt meta-harness" execution

The plan in `adapt-meta-harness.md` (Part B ≈ `spec/meta-harness.md` v1.1) is
executed as a project anchored in this directory. Canonical contract lives
in-repo: `spec/meta-harness.md` (paper harness, R1–R5). Sandbox keeps deep
material; the repo keeps the thin contract and the `WORK.md` ledger.

| Status | Step | Note |
|---|---|---|
| [x] | Sandbox map committed | `docs(harness)` (this commit) |
| [x] | T0 — paper layer live: repo `WORK.md` seeded, AC1 accepted, spec statuses synced | `docs(harness)` (this commit) |
| [ ] | Scaffold — vertical slice + `scripts/acyx/harness.ts` green (AC2) | biggest step |
