# doc — CONTEXT

The repo's two **read-only truth** docs. Everything else cites them; nothing
else defines design or process.

| File | Role | Cap (R4) |
|---|---|---|
| `GDD.md` | design truth §1–11: vision, core loop, player, enemies, domes, scoring/lives, controls, world/FX vocabulary. §8 = port rule *measure, don't invent* — TBD tables await prototype measurement | 24 KiB |
| `omt-ts-methodology.md` | port process: §5 layer rules (Game-MVC++), §6 partners, §8 commands, §10 OpSpec TSDoc, §12 TDD, §16 detectors → enforced by `scripts/acyx/harness.ts` | 24 KiB |

Rules: intentional GDD divergence is written down here first (changelog row);
methodology §5/§16 are single-source for the harness, mirrored in sync.

Up: `../AGENTS.md` (map) · Down: `../spec/CONTEXT.md` (thin contracts)
