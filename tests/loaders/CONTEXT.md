# tests/loaders — CONTEXT

Vitest mirrors of `src/loaders` — the gateway's *decision layer* only (the
registry fallback behavior), which is pure TypeScript; actual network loading
needs a browser (methodology §11).

| File | Covers |
|---|---|
| `registry.test.ts` | key set (9), zero-`.glb` fallback resolution, placeholder factory per key, unknown-key throw |

Up: `../CONTEXT.md` · Down: `../../src/loaders/CONTEXT.md`
