# OMT++ TypeScript Methodology — Captain Cargo X adaptation

How we build this TS/three.js game: the OMT++ method (phased analysis → design
→ programming → testing with visible artifacts, MVC++-style layering and
partner seams) translated from agentx's Python/TUI reality to **web game
development with TypeScript and a browser 3D library**.

> Self-contained rewrite — the upstream OMT++ docs live in the git-ignored
> reference (`.sandbox/references/agentx/.meta/...`); nothing needed for
> daily work may depend on that path. Enforcement linkage lives in
> `spec/meta-harness.md` (S1–S5); this file owns the *method*, that spec owns
> the *mechanics*. Concepts restated in CCX terms — not a copy of the guide.

## Changelog

| Date | Change |
|---|---|
| 2026-10-24 | Initial adaptation: phases, Game-MVC++, partners, gateways, commands, states, OpSpec, testing, artifacts, checklists. |

---

## 1. Mindset — six working principles

1. **Practical over theoretical** — code that ships; patterns only when they
   pay rent in testability or clarity.
2. **Right-sized** — a bug fix is not a feature is not a new project; the
   artifact weight scales with the task (§13).
3. **Full cycle, never skip** — every change walks understand → design →
   implement → verify; jumping idea → code is the root of most defects.
4. **Visible artifacts** — each phase leaves a tangible file (GDD section,
   spec, test list, test report). Not bureaucracy: deliverables.
5. **Controlled pace** — plan, execute phase, close phase; no half-stacks.
6. **Architecture first** — in games, architecture speed comes from *not*
   fighting the layer boundary every frame (§5).

First question on any request: **"Which OMT++ phase am I in?"** Vague →
Analysis. Clear feature → Design. Code task → Programming (confirm a design
artifact exists). Defect → Testing.

## 2. Phase model — and what each phase means here

```
Feasibility (pre-phase: 4 questions + frame budget — §4)
   → ANALYSIS  : WHAT does the player experience?       → doc/GDD.md section
   → DESIGN    : HOW in modules/contracts/perf budget?  → spec/*.md (status draft → agreed)
   → PROGRAMMING: code + tests, TDD for pure logic     → src/, tests/ (ledger not used — see spec/meta-harness.md v1.1)
   → TESTING   : harness:check green + gameplay truth   → test report / WORK.md [x]
```

| OMT++ artifact | CCX counterpart |
|---|---|
| Use case | GDD mechanics section + its verify column |
| Operation list | Spec table rows (one row = one operation with values TBD) |
| Analysis class diagram | Entity/behavior table in a spec |
| Dialog diagram | Screen/state transition map (§9) |
| Design class diagram | Module tree + class list in a spec |
| Sequence diagram | Event-bus flow (who emits → who listens) |
| Operation spec | TSDoc Preconditions/Exceptions/Postconditions (§10) |
| Test plan | Normal/Exceptions rows in a spec (the `scoring.md` pattern) |
| Test report | `WORK.md` DONE row + pointer (unit/integration evidence) |

Rules inherited unchanged: declare the phase before acting; missing input =
back to Analysis; broken design found while testing = back to Design; a phase
ends **only** with its artifact on disk; artifacts freeze in git history.

## 3. Two parallel paths — always model both

```
STATIC (structure)                        FUNCTIONAL (behavior)
what modules/classes/files exist?         what happens step by step?
Analysis: entities + ownership            Analysis: gameplay moment script
Design: module tree, interfaces           Design: frame walk + event flow
Programming: files + classes              Programming: update loop wiring
Testing: import/lint pins                 Testing: use-case walkthrough
```

Concrete CCX habit: for each feature, sketch **both** before code —
(a) a module tree (e.g. `game/enemies.ts` owns JetFlight), and (b) one frame
of t = past a fixed clock: `Input → Player intent → sim (Player/Enemies/
Dome) → bus events (score/explosion/splash) → views read state + FX → HUD
DOM`. Isolated code that never connects, or spaghetti flows without owners —
Modeling both is the fix for both failure modes.

## 4. Feasibility — pre-phase, mandatory

Four questions before any work: requirements understood (ask, never guess)?
scope = one-sentence done? exact files known (explore if not)? risk level
(new state/entity/asset = high; param tweak = low)?

Game-specific feasibility additions:

- **Frame budget**: the Design phase must state the expected per-frame cost of
  a new system (allocations per frame, pool growth, g.latency from collision
  checks). Target: 16.6 ms total, headroom ≥ 30%. No per-frame allocation in
  hot paths — pooled objects by default.
- **Asset dependency**: art-affecting features need the `art` task path —
  the `.blend`/`.glb` must be sourced or a placeholder must own the gap
  (`spec/asset-pipeline.md`), before Programming starts.
- **Web constraints**: WebGL context loss, mobile input diffs, first-load size
  — high-risk rows land in the feasibility statement itself.

Say *no / not yet* when scope is vague, too large (split), or deps are
missing (research first) — with the split already proposed.

## 5. Game-MVC++ — absolute layer rules (the core adaptation)

agentx's Table (Model knows nothing about UI; View never imports Model;
SQL only in DP classes) translates to a **game engine** with one hard rule
added: the simulation is pure, the renderer is disposable.

| Layer (dirs) | Role | May import | Must never |
|---|---|---|---|
| **Model** — `src/game`, `src/utils` | domain logic: Scoring, spawn director, waves, collisions, pure heightfield/noise | `src/utils` only | three.js, DOM, network, bus-glue |
| **Controller** — `src/core` | orchestration: state machine, input→commands, event bus, pooled clocks | `src/game`, bus | three.js scene calls, DOM writes (HUD news = bus events) |
| **View** — `src/render`, `src/world`, `src/fx` | three.js scene assembly, environment meshes, particle views; **polled state readers** | `three`, `src/game` state **read-only**, `src/george`. | mutate game state, own gameplay decisions |
| **UI/HUD** — `src/ui` | DOM overlay: lives/score/menus | bus events, `#hud` DOM | import `three` |
| **Gateway** — `src/loaders`, `src/core/persistence` | all external I/O: glTF registry, localStorage saves | `three` (GLTF), fetch/localStorage | contain gameplay logic |

Enforceable import policy (supersedes the rough rule in `spec/meta-harness.md` §4):

- `three` **permitted** in: `main.ts` (bootstrap), `src/render/`, `src/world/`,
  `src/fx/`, `src/loaders/`.
- `three` **forbidden** in: `src/game/`, `src/core/` (except the single
  GameApp→render wiring file), `src/ui/`, `src/loaders/` logic surrounding
  the registry decision layer.
- Views **read** model state every frame (pull) and listen to bus events;
  they **never write** it. HUD gets text-only events. All entity meshes are
  re-created/pooled by views; model entities are scene-free data objects.

Anti-patterns (unchanged in spirit, game-flavored): fat view (sim logic
hidden in mesh code), anemic model (getters only), controller doing engine
calls, DI-inverted view (see §6), "temp Vector3/geometry per frame" in hot
paths, un-seeded RNG inside gameplay decisions, gameplay state leaking into
HUD (HUD extended from events only).

## 6. Abstract Partner → TypeScript interface + constructor injection

partner pattern in CCX = interface seam, so terminal knowledge (ABC +
@abstractmethod) is TS-equivalent-only:

```ts
// src/core/partners.ts
export interface IRunHudPartner { onScore(n: number): void; onLives(n: number): void }
// view-side shows; controller implements:
export class RunHud implements IRunHudPartner { constructor(root: HTMLElement) { … } }
```

Rules (small; structural): partners are `interface`s declared with the thing
they serve; the implementation receives the seam it owns via **constructor
injection**; a View receives its partner in the constructor and creation of a
controller from a view is a review error; partner methods = complete API (no
private back-channels). Tests mock the interface object directly (types only
in TS; no runtime registration ceremony).

## 7. Data Provider → Resource gateways

agentx hard rule (all SQL in DP_* classes) maps to: **all external I/O lives
in gateway classes** — nothing else fetches, reads filesystem-ish APIs or
stores.

- `src/loaders/<asset>.ts` — every `.glb` load path through one registry with
  placeholder fallback (style/paraphrase the plan in `spec/asset-pipeline.md`).
- `src/core/persistence/save.ts` — single localStorage wrapper for
  best-score/settings; JSON schema versioned; **no** `localStorage` elsewhere.
- Feasibility gate: any new external touchpoint (analytics, replay dump) must
  enter as a new gateway module — never an inline `fetch` inside a game/ widget.

Class↔storage mapping equivalence to agentx's OMT↔SQLite: entity → save-blob
key; association → nested id; collections → arrays; **versioning the schema
is a Design-phase artifact** (migrations keep player saves).

## 8. Command pattern → input intents

Input is parsed into **commands** (`src/core/commands/`), not consumed raw:

- `input-commands.ts`: `Steer(delta) | Climb(delta) | Fire | Pause | …`
- controller loop: input parser → intents → translate-to-model-ops with
  cooldown/permission checks.
- Rules: commands never reach views or meshes directly; they change **model
  state** (or request FX via bus). HUD/scene reads state; FX subscribes bus.
- The command stream is serialized → replay/profiling levels (commands +
  RNG seed = deterministic run) — a Design artifact from day 1, not an
  afterthought.

Command vs other constructs (agentx decision table, game version):

| Want to… | Do this |
|---|---|
| New input verb (<1 existing system) | new Command + case in parser/keymap |
| New verb + affects a pure module | new Command + Operation in Model + spec row |
| Timed/random pattern of actors | no command — spawn director design in Model |
| Player-state UI flip (pause) | State transition (§9), not a command |

## 9. Screen triads → game states (MVC triad per state)

agentx screens (main/chat/rag with controller+view triads) become **states**:
`Menu, Playing, Paused, GameOver`.

- Each state owns: its view (HUD config, overlays or scene lighting changes),
  its entering/exit cleanup, and its partner interfaces toward the core.
- Sub-states take over input, don't reach back to parents (leader board in
  game-over doesn't poke the earlier gameplay loop), and the state machine is
  the *single* owner of valid transitions (analog of the harness FSM: no
  jump-skip GameOver → Programming-only states).
- A **new state** is the CCX `major_feature`-class task:

```ts
// state contract (all states implement)
export interface GameState {
  enter(ctx: GameCtx, from: GameOverState | null): void; // pause cleanup
  tick(dt: number, now: number): void;
  exit(): void; // scene/HUD deltas are written by views
}
```

Screens get a **state-driven** migration: `Playing → GameOver` repeated
LGTH; whereas Menu → Playing is the same call-site family (7 design-branch
reviews in a row for an inherent transition ⇒ the map is wrong if review
flames: revisit GDD Open question case §6).

## 10. Operation Specifications (OpSpec)

Public model + controller methods that matter carry the TSDoc triple
(Preconditions / Exceptions / Postconditions), extracted from the GDD use
case — the compact contract that review checks and tests mirror:

```ts
/**
 * Add one verified kill to the streak chain.
 * Pre:  run is live; kill at `nowS` run-seconds.
 * Exc:  no streak entry (first kill) — silently seeds multiplier 1.0.
 * Post: score raised by base × multiplier (cap ×4); streak window armed
 *       to nowS + 1.5 s; emits `score` anniversary bus event.
 * Spec: spec/scoring.md rows SC2–SC5 are the test oracles.
 */
addKill(nowS: number, base: number): number
```

Rule: a public method with no OpSpec spec is a review-blocking gap once the
file ≥ "feature-truth" size; the OpSpec points at the spec rows so docs and
tests can never drift far.

## 11. Testing strategy — three stages

| Stage | What | CCX operationalization |
|---|---|---|
| 1 — Unit | one class, isolated | vitest; mock partners as typed objects; >80% branches on pure modules |
| 2 — Integration | components together | controller + model with a stub HUD partner; injected clock (`now` is a parameter — no `Date.now` in model), deterministic RNG |
| 3 — System | full workflows vs use cases | **gameplay-session checklist** as visual truth: score surge confirms shield-dome break; chain-doubling; 60 fps any scene 120 s |

Web-game reality: visually-correct rendering cannot be asserted headless —
the renderer is out of unit scope by design (`three` mocks come free because
the Model has zero `three` imports). Browser-level smoke tests may be added
later (optional Playwright: open → start → first kill event → HUD text
change); until then the Stage-3 checklist **is** the system test, with its
result recorded like a test report. TH (worldWeeks): DO NOT grow a WebGL
canvas test harness before S2 lands its core.

Test plan template stays agentx's Normal/Exceptions pair — one row per spec
operation: normal path, and everything that can go wrong (cooldown attack,
boundrade door: spawn-out-of-bounds, font-load fail), each pointing to the
behavioral row.

## 12. TDD — two hats, vitest flavor

For `major_feature` (any new state, entity family, or the scoring core):
TESTLIST → RED (only `tests/` compiles) → GREEN (only `src/`+) → REFACTOR
(still green) → DONE. Mechanics: the vitest whole-file rule (no `-t`
filters — false greens) is the binding rule, `spec/meta-harness.md` is the
when/if. Art-heavy features
run the same cycle **at the placeholder-contract level** (registry keys,
scale contracts), not pixel level.

## 13. Artifact decision matrix — what each task type must produce

| Artifact | bug_fix | minor | major | new state | art |
|---|---|---|---|---|---|
| Feasibility statement | 1-line | 1-line | full | full | resource-path only |
| GDD section edit | ❌ | row | ✅ | ✅ | tuning table |
| Spec row(s) (operations list) | ❌ | 1–2 rows | ✅ | ✅ | asset-pipeline entry |
| Design class/module list | ❌ | sketch | ✅ | ✅ (plus component matrix) — imports | n/a |
| OpSpec for the new public ops | ❌ | quick | ✅ | ✅ | n/a |
| Unit tests | ✅ | ✅ | ✅ | ✅ | n/a |
| Integration tests | ❌ | if new deps | ✅ | ✅ | n/a |
| System truth (session/or Playwright) | ❌ | replay record | ✅ | ✅ | gameplay session |
| `.blend`/`.glb` artifact | n/a | if skin changes | n/a | n/a(required | if visuals) |

Rule of thumb preserved: one file touched → skip analysis, write tests;
2–3 files → quick op list + design sketch; new state/meta-system → full
artifact set; new project scale → everything.

## 14. Phase checklists (condensed, CCX rows)

- **Before:** requirements clear; done-sentence; files known; risk +
  frame-budget estimate; phase declared (S3+ ledger).
- **Analysis:** GDD row(s); operations extracted; entities named.
- **Design:** module list + partner interfaces; three-import paths chosen;
  OSpecs; **frame budget line**; spec status bumped `draft → agreed`.
- **Programming:** partner-via-constructor only; no three in model/core;
  pools not allocations; specs kept green (`harness:check` at exit).
- **Testing:** unit >80%; integration for interactions; session-truth record
  per Stage-3 checklist; WORK.md [x] row with pointer.

## 15. Do / Don't quick reference

| Want to… | Do |
|---|---|
| Route a user action | Command (§8) or state transition (§9) |
| Show damage/score change | emit bus event → `src/ui` + `src/fx` react |
| Need collision/routes | pure functions in `src/game`; views call with state |
| Load/save anything | gateway class (`src/loaders`, `src/core/persistence`) |
| Add a spawn pattern | Model spawn director design; no view code |
| Test input flows | mock the HUD partner object, drive the command stream |
| Start engine work | phase first, artifacts before pixels |

| Never do this | Why |
|---|---|
| import `three` inside `src/game/**` | sim must be testable headless; renderer must stay replaceable |
| View mutates game state | race-order bugs; breaks replay determinism |
| Unlabeled public game operators | spec drift (§10 exists to prevent that) |
| Per-frame allocations in hot paths | GC spikes → frame drops — the classic web-game failure |
| Views create/construct controllers manually | constructor injection only (§6) |
| Skip the stage-3 session check after FX/render-heavy merges | visual truth is not unit-testable — that checklist is the only guard |
| Idea → code without a spec row | "fast" that costs redesign |

## 16. Ten mistakes to catch (with detectors)

| # | Mistake | Detect (grep once `npm run harness` exists) | Fix |
|---|---|---|---|
| 1 | `three` inside model/core | eslint `no-restricted-imports` pin | move to view or invert via bus event |
| 2 | View writes game state | grep mutations on model objects in views | read-only state pull or event |
| 3 | `localStorage`/`fetch` outside gateways | grep | new gateway module |
| 4 | UI logic inside controller (DOM writes) | grep `document.` in `src/core`/ | dispatch event; HUD listens |
| 5 | Partner class not injected | grep `new .*Partner` in views | constructor param |
| 6 | `Date.now`/`performance.now` in `src/game` | grep | accept `now` param (deterministic) |
| 7 | Unpooled particle/mesh per-frame `new` | code review + perf in A-frame budget | pools in `src/fx`/`src/render` |
| 8 | Raw stateful mutation of RNG global | grep (seed never reset → replay breaks) | seeded factory from `GameCtx` |
| 9 | Spec status drift (implemented code, spec unchanged in place) | pin test comparing spec rows↔OpSpec count (gross pass) | same-change update, `docs:` commit |
| 10 | Skipping phases on a big task | ledger gap analysis (S3+) | produce artifact first |

## 17. Where enforcement lives

This file owns *what OMT++ means here*; `spec/meta-harness.md` (v1.1,
"paper harness") owns *what is mechanical*. Before `npm run harness` exists,
the checklists above are review-time discipline; after it lands (shipped
with the game scaffold), the §16 detectors 1–6 run in that script; any
plugin gate is added only on a measured trigger (spec §4).
