# Spec — META HARNESS implementation (`paper harness` for Captain Cargo X)

Status: **implemented (v1.3)** — paper layer + mechanical enforcement live; the
check script is `scripts/acyx/harness.ts` (`npm run harness`, green). This file
is **self-contained**: agentx reference + deep analysis live in the untracked
`.sandbox/` membrane (map: `.sandbox/CONTEXT.md`); nothing below depends on them.

## Changelog

| Date | Change |
|---|---|
| 2026-10-24 | v1.0–v1.2 contract + paper layer + scaffold + nav layer (details in git history). |
| 2026-10-24 | **v1.3 — fully mechanical (agentx-adapted)**: R1 ledger + commit audit · R2 status gate + index sync · R3 TA-deletion guard · transport: origin-only remotes (harness lint + denies; commit allowed, push denied). |

## 1. Objective — effective at minimum machinery

Prevent the only three failure modes that are real in a solo, agent-driven
game repo: **(1) context-window bloat, (2) code drifting from the design
docs, (3) undocumented changes losing cross-session memory.** Filter every
upstream (agentx) mechanism through one question: *is there a simpler
mechanism that prevents this failure in THIS repository?*

| Capability | Heavy (agentx) | CCX v1.3 | Why it stays effective |
|---|---|---|---|
| Process audit | JSONL ledger | `WORK.md` rows + git + harness audit | grep-able, survives compaction |
| Phase gating | `omt_phase` chain | spec-citation status gate (grep) | same failure caught, no plugin |
| Token budgets | compile-enforced | byte caps + script check | bloat lives only on capped files |
| Layer policy | MVC++ linter + plugins | methodology §5/§16 greps | same detection, no plugin pitfalls |
| Cross-session thinking | `omt_think` tool | `TA:` + grep + deletion guard | identical retrieval, zero tooling |
| Transport/deny | shell deny config | same mechanism, static | zero per-turn cost |
| Concurrency / self-evolution | Petri net / session tools | **out of scope** | solo dev; see §4 triggers |

## 2. The paper harness — six rules (active, mechanically checked)

1. **Task declaration (R1)** — every non-trivial `src/` task exists as a
   `WORK.md` line: `[ ]` pending → `[~]` in progress → `[x]` done. Commit
   format: `<tag>(<area>): <subject>`, tag ∈
   `feat|fix|refactor|test|docs|art|state`.
   *Mechanical:* the harness lints every row (valid date, marker vocabulary,
   task + spec cells non-empty, `[x]` ⇒ evidence carries a commit ref) and
   audits history since the paper layer went live (`c78568b`): every
   src-touching commit's hash must appear in a `WORK.md` evidence cell, and
   every commit subject in that window must match the format (earlier
   commits exempt).
2. **Spec status gate (R2)** — code implementing a `spec/*.md` file may be
   written only when its status is `agreed` or beyond. Early-phase tuning is
   exempt: `doc/GDD.md §2` (measured-prototype truth) outranks specs.
   *Mechanical:* the gate keys on *affiliations* — a `spec/<name>.md`
   citation in a `src/` file's top header block declares "this file
   implements spec X" and must resolve to a real spec whose status line
   parses and reads ≥ `agreed` (draft ⇒ exit 1); body citations are pointers
   (not implementation) and are checked only to exist; `spec/README.md`
   index must list every spec with the same status word as the spec's own
   `Status:` line (drift ⇒ exit 1).
3. **Think tags (R3)** — persistent inline `TA:` comments carry hard-won
   gotchas; a tagged file is re-read (grep) before editing; tags are never
   deleted silently.
   *Mechanical:* for each code file, a `TA:` tag present at `HEAD` but gone
   from the working tree fails the check unless the file now carries a
   `TA-:` removal note (the non-silent deletion marker). Guard bites
   pre-commit — the natural `npm run harness` point.
4. **Budgets (R4)** — agent-facing **markdown** files only (source code is
   never budgeted): `AGENTS.md` ≤ 4.0 KiB · each `spec/*.md` ≤ 8 KiB ·
   `doc/GDD.md` ≤ 24 KiB · `doc/omt-ts-methodology.md` ≤ 24 KiB · `WORK.md`
   ≤ 10 KiB · every folder `CONTEXT.md` ≤ 2 KiB. Every bump is a deliberate,
   written-down decision.
5. **Exit check (R5)** — no task is `[x]` until `npm run harness` is green.
   *Mechanical:* the exit check runs at ask-time (agent runs it before
   closing a row); nothing gates git itself — `git commit` is **always
   allowed** (no pre-commit hook, ever).
6. **Nav maps (R6)** — every folder in a tracked path carries a
   `CONTEXT.md` ≤ 2 KiB (purpose, per-file pointers, Up/Down links);
   presence + size harness-checked from `git ls-files`. `.sandbox/` stays
   self-policed (external membrane).

## 3. The effective layer — one script + one deny list

`scripts/acyx/harness.ts` (single file, Node std-lib only, wired as
`npm run harness`) checks, each failure ⇒ exit 1 with a one-line pointer:

1. `tsc --noEmit` + `vitest run` (R5);
2. **budgets** (R4, above);
3. **boundaries** — methodology §5 import policy + §16 detectors (greppable
   subset: D1/D3/D4/D5/D6 — D2 is review-time);
4. `TA:` digest — count + locations of persistent gotchas;
5. **context** (R6) — tracked folders carry a ≤ 2 KiB `CONTEXT.md`;
6. **ledger** (R1 as written: row lint + src-commit + commit-format audit);
7. **spec status** (R2: affiliations ≥ agreed; pointers exist; index sync);
8. **TA guard** (R3 as written: HEAD-vs-tree tag diff, `TA-:` escape);
9. **transport lint** — `git remote` must be exactly `origin`, and every
   `branch.*.remote` config must point at `origin`.

**Transport, agent-side (`opencode.jsonc` — static, zero-token config):**
`git push *` denied; remote mutation
(`remote add/set-url/remove/rename`, `submodule`, `clone`) and fetch/pull
with a non-origin URL denied. Read-only git and **all commits** stay
allow-by-default — the list protects what check 9 also detects, but blocks
before damage instead of after.

That is the whole machine: no runtime gates, no ledgers, no modes.

## 4. Grow-on-trigger (replaces any sprint plan)

Instrument **only after a measured incident**, never preemptively:

| Measured trigger | Instrument to add | Cost class |
|---|---|---|
| Resume from `WORK.md` + git log fails twice | `.meta/.omt/ledger.jsonl` + CLI | small |
| Agent edits a tagged/spec file without consulting it (twice) | first opencode *plugin* gate (read upstream gotchas first: TS plugins don't hot-reload; before/after hook arg asymmetry) | plugin |
| Recurring budget violations | `budgetc` moves to CI pin test | trivial |
| Second recurring manual maintenance loop | `.workflows/` catalog + approval gate | low |
| ≥2 agent sessions on adjacent files / ≥50 sessions | agentx concurrency / session-evidence tooling, adopt upstream | big |

**Permanently out (this repo):** DSL + projection compiler, receipt/e2e
ceremony, god compiler, AKB consult gate — reopen only at game-series scale
(deep analysis in `.sandbox/adapt-meta-harness.md` §B.6).

## 5. What v1.1 deliberately dropped — and why simple still wins

- **No runtime gates** — per-turn token cost; the script + static config
  catch the same defects for zero recurring cost.
- **No generated `AGENTS.md`, no new file formats** — hand-written +
  `WORK.md` + git are the only state.

## 6. Acceptance criteria

- [x] **AC1:** AGENTS.md carries the R summary + pointer; `WORK.md` exists;
  budgets recorded.
- [x] **AC2:** green on a clean tree; seeded violations each exit 1 with a
  one-line pointer.
- [x] **AC3:** cross-session reconstruction from `git log` + `WORK.md` in
  ≤3 sentences.
- [x] **AC4 (zero ceremony):** the harness never mediates human-only
  workflow; it gates only agent-driven task closure. v1.3 precision: commits
  never blocked; denies touch only transport.
- [x] **AC5:** every §3 check has a seeded-violation proof (violation →
  exit 1 + one-line pointer → reverted); `WORK.md` rows hold the evidence.

## 7. Open questions

1. R2 speed risk (agreed-before-code vs rapid prototyping) — candidate
   exemption: `tuning` class changes (values only, no mechanics).
2. `WORK.md` metadata richness (`<!-- id prio agent -->`): adopt later.
