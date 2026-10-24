# scripts/acyx — CONTEXT

The ONE check script: `harness.ts` (`npm run harness`), mirroring
`spec/meta-harness.md` §2–§3 — keep the mirrored caps in sync with the spec:

1. typecheck (tsc) + tests (vitest) — the R5 gate
2. budgets (R4): AGENTS.md 4 KiB · `spec/*.md` 8 KiB · GDD / methodology
   24 KiB · WORK.md 10 KiB
3. boundaries — import-policy + detectors (methodology §5, §16 D1/D3–D6;
   D2 is review-time)
4. context check (R6) — per tracked folder: `CONTEXT.md` present, ≤ 2 KiB
5. `TA:` digest (informational)

TA (R3): this script runs via Node type-stripping — no enums /
parameter-properties (see `harness.ts` header).

Up: `../../spec/CONTEXT.md` · Down: `harness.ts`
