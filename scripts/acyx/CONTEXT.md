# scripts/acyx — CONTEXT

The ONE check script: `harness.ts` (`npm run harness`), mirroring
`spec/meta-harness.md` §2–§3 (v1.3) — keep mirrored caps in sync with the
spec; `opencode.jsonc` (repo root) carries the agent-side git-transport
denies (commit always allowed · push denied · origin-only remotes):

1. typecheck (tsc) + tests (vitest) — the R5 gate
2. budgets (R4): AGENTS.md 4 KiB · `spec/*.md` 8 KiB · GDD / methodology
   24 KiB · WORK.md 10 KiB
3. boundaries — import-policy + detectors (methodology §5, §16 D1/D3–D6;
   D2 is review-time)
4. `TA:` digest + guard (R3) — HEAD-vs-tree tag diff; a deleted tag needs a
   `TA-:` note in the file
5. context (R6) — per tracked folder: `CONTEXT.md` present, ≤ 2 KiB
6. ledger (R1) — WORK.md row lint + src-touching-commit audit +
   commit-format gate since epoch `659446c`
7. spec status (R2) — file-header spec affiliations ≥ agreed; body
   citations existence-checked; spec/README.md index sync
8. transport — remotes exactly `origin`; `branch.*.remote` = origin

TA (R3): this script runs via Node type-stripping — no enums /
parameter-properties (see `harness.ts` header).

Up: `../../spec/CONTEXT.md` · Down: `harness.ts`
