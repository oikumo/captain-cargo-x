# Spec — META HARNESS implementation (`paper harness` for Captain Cargo X)

Status: **implemented (v1.1)** — paper layer + game scaffold live; the check
script is `scripts/acyx/harness.ts` (`npm run harness`, green). This file is
**self-contained**: the agentx reference + the deep analysis live in git-ignored
`.sandbox/` (execution workspace — bulk untracked, entry map
`.sandbox/CONTEXT.md` tracked); nothing below depends on them.

## Changelog

| Date | Change |
|---|---|
| 2026-10-24 | Initial contract: 5 rules + sprint plan S1–S5. |
| 2026-10-24 | **v1.1 — simplicity rebalance**: git-native audit, ONE check script, grow-on-trigger gates. S3/S4/S5 collapsed into incident-driven growth (original plan kept in git history). |
| 2026-10-24 | **T0 executed**: `.sandbox/CONTEXT.md` tracked as the sandbox entry map (gitignore exception); root `WORK.md` seeded — AC1 meets its checklist. |
| 2026-10-24 | **Scaffold commit**: status `draft → agreed` (user in the loop); §3 lands as `scripts/acyx/harness.ts` wired to `npm run harness`; AC2 proven in-session (three seeded violations, each exit 1). |
| 2026-10-24 | Closure: AC2 ✓ and AC3 ✓ ticked; status `agreed → implemented`. |

## 1. Objective — effective at minimum machinery

Prevent the only three failure modes that are real in a solo, agent-driven
game repo: **(1) context-window bloat, (2) code drifting from the design
docs, (3) undocumented changes losing cross-session memory.** Everything the
META HARNESS upstream does is filtered through one question: *is there a
simpler mechanism that prevents this failure in THIS repository?*

| Capability | Heavy (agentx) | CCX v1.1 | Why it stays effective |
|---|---|---|---|
| Process audit | JSONL ledger + expiry windows + tools | `WORK.md` task lines + git commits | grep-able by human & agent, survives compaction, zero runtime |
| Phase gating | `omt_phase` gate chain | spec-status gate + task-tag commit format (R1/R2) | same failure caught (code ahead of design) at review time |
| Token budgets | compile-enforced, 11 surfaces | 2 enforceable caps (AGENTS.md, specs each file) + script check | bloat lives almost only there; other files free-form |
| Layer policy | MVC++ linter + after-gate plugin | policy in methodology guide + grep in the check script | same detection (§3), no plugin, no TS plugin pitfalls |
| Cross-session thinking | `omt_think` tool + think-gate | `TA:` comment convention + grep | identical retrieval cost, zero tooling |
| Concurrency plane | Petri-net gate + worktrees | **out of scope** | solo dev; trigger below |
| Self-evolution | `omt_session` evidence tooling | **out of scope** | needs ≥50 real sessions first |

## 2. The paper harness — five rules (active now)

1. **Task declaration (R1)** — every non-trivial `src/` task exists as a
   `WORK.md` line: `[ ]` pending → `[~]` in progress → `[x]` done (done rows
   keep a pointer to the commit + the spec they implement). Commit format:
   ``<tag>(<area>): <subject>`` with tag ∈ `feat|fix|refactor|test|docs|art|state`.
2. **Spec status gate (R2)** — code that implements a `spec/*.md` file may be
   written only when that spec's status is `agreed` (or the same change bumps
   the status, with the user in the loop). Early-phase tuning is exempt:
   `doc/GDD.md §2` (the measured-prototype truth) outranks specifications.
3. **Think tags (R3)** — persistent inline `TA:` comments carry hard-won
   gotchas; a tagged file is re-read (grep) before editing; tags are never
   deleted silently. One line per thought.
4. **Budgets (R4)** — `AGENTS.md` ≤ 4.0 KiB · each `spec/*.md` ≤ 8 KiB ·
   `doc/GDD.md` ≤ 24 KiB · `WORK.md` ≤ 10 KiB ·
   `doc/omt-ts-methodology.md` ≤ 24 KiB. Every bump is a deliberate,
   written-down decision. (Measured at adoption: AGENTS.md is 7.8 KiB —
   accepted debt, trim scheduled at the scaffold commit, not forced mid-flight.)
5. **Exit check (R5)** — no task is `[x]` until `npm run harness` is green.

## 3. The effective layer — one script, shipped WITH the scaffold

No dedicated harness sprint. The game scaffold (`package.json`, `vite`,
vitest) lands with `scripts/acyx/harness.ts` (single file, ~60 lines, Node
std-lib only) wired as `"harness": "node scripts/acyx/harness.ts"`:

1. `tsc --noEmit` + `vitest run` (exit on failure);
2. **budget check** — byte-count the R4 files, exit 1 on overage;
3. **boundary check** — grep `three` imports outside the permitted dirs from
   `doc/omt-ts-methodology.md` §5 (the policy single-source), exit 1 on hit;
4. `TA:` digest line — count + per-file + stale so a new session sees all
   gotchas in one grep.

That is the whole machine. No opencode plugins, no ledgers, no modes.

## 4. Grow-on-trigger (replaces the sprint plan)

Instrument **only after a measured incident**, never preemptively:

| Measured trigger | Instrument to add | Cost class |
|---|---|---|
| Resume from `WORK.md` + git log fails twice | append-only `.meta/.omt/ledger.jsonl` + `ledgerc` | small CLI |
| Agent edits a spec-tagged file without consulting it (once, then again) | first opencode plugin gate: `protect → phase-ledger → think` (read the upstream plugin gotchas first: TS plugins don't hot-reload; before/after hook arg asymmetry) | plugin |
| Recurring budget violations | `budgetc` moves from R4 convention to CI pin test | trivial |
| Second recurring maintenance loop the agent repeats by hand | start the `.workflows/` catalog (2-level discovery + approval gate) | low |
| ≥2 agent sessions working adjacent files | reconsider the Petri-net concurrency plane — adopt agentx design upstream, don't fork it | big |
| ≥50 real sessions / unexplained cost spike | session-evidence tooling (`omt_session` analog) | big |

**Permanently out (this repo):** DSL + projection compiler, receipt/e2e
ceremony, god compiler, AKB consult gate — reopen mirrors the analysis
(`.sandbox/adapt-meta-harness.md` §B.6) only at game-series scale.

## 5. What v1.1 deliberately drops — and why simple still wins

- **No runtime gates initially** — gates pay per-turn token cost (every hook
  rides the tool loop). With few sessions, review + the check script catch
  the same defects for zero recurring cost.
- **No generated `AGENTS.md`** — hand-written stays; drift risk is bounded by
  R2 + review checklist, not a compiler suite to maintain.
- **No new file formats** — WORK.md conventions + git are the only state.

## 6. Acceptance criteria

- [x] **AC1 (now):** AGENTS.md §7 carries the R1–R5 summary + methodology
  pointer; `WORK.md` exists with its first pending task (`scaffold
  vertical slice`); this spec's budgets are the recorded numbers.
- [x] **AC2 (scaffold):** `npm run harness` green on a clean tree; three
  seeded violations (over-budget specimen, out-of-boundary import, failing
  test) each produce exit 1 and a one-line pointer.
- [x] **AC3:** cross-session reconstruction: from `git log --oneline` +
  `WORK.md` alone, "what did the last session do, what's next" is answerable
  in ≤3 sentences.
- [ ] **AC4 (zero ceremony):** the harness never mediates human-only
  workflow (`npm run dev`, plain `git commit` without agents); it gates only
  agent-driven task closure.

## 7. Open questions

1. R2 speed risk in rapid-prototyping mode: is requiring `agreed` before
   gameplay-mechanic code too slow while specs are intentionally thin?
   Candidate exemption: `tuning` class changes (values only, no mechanics).
2. `WORK.md` metadata richness (`<!-- id prio agent -->`): adopt the
   convention now (upstream-compatible) or later?
3. AGENTS.md slimming plan (7.8 KiB → 4.0 KiB): which sections become nav
   pointers — decide at the scaffold commit when the workload is visible.
