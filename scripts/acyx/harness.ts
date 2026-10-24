/**
 * The ONE check script — spec/meta-harness.md §3. Wired as `npm run harness`.
 * Node ≥ 22 native TypeScript (type-stripping); Node std-lib only.
 *
 * Enforces (each failure ⇒ exit 1 with a one-line pointer):
 *   1. typecheck (tsc --noEmit) + tests (vitest run)
 *   2. budgets (R4)     — caps mirrored from spec/meta-harness.md §2 R4
 *   3. boundaries       — policy mirrored from doc/omt-ts-methodology.md §5,
 *                         detectors §16: D1 engine-imports, D3 io-gateways,
 *                         D4 DOM-in-controller, D5 view-built controllers,
 *                         D6 wall-clock-in-model
 *     (D2 view-mutates-state is not statically greppable — review-time, §6)
 *   4. TA digest        — count + locations of persistent `TA:` gotchas (R3)
 * Keep the mirrored values in sync with those two spec files.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
let failures = 0;

const ok = (m: string): void => console.log(`  ✓ ${m}`);
const fail = (m: string): void => {
  console.error(`  ✗ ${m}`);
  failures++;
};

// -- 1. typecheck + tests ----------------------------------------------------
for (const [label, cmd] of [
  ['typecheck', ['tsc', '--noEmit']],
  ['vitest', ['vitest', 'run']],
] as const) {
  const res = spawnSync('npx', cmd, { cwd: ROOT, stdio: 'inherit' });
  if (res.status === 0) ok(`${label} green`);
  else fail(`${label} failed — see output above`);
}

// -- 2. budgets (spec/meta-harness.md §2 R4) ----------------------------------
const budgeted: Array<[string, number]> = [
  ['AGENTS.md', 4096],
  ['WORK.md', 10240],
  ['doc/GDD.md', 24576],
  ['doc/omt-ts-methodology.md', 24576],
  ...readdirSync(join(ROOT, 'spec'))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f): [string, number] => [`spec/${f}`, 8192]),
];
let budgetRead = 0;
for (const [file, cap] of budgeted) {
  try {
    const size = readFileSync(join(ROOT, file)).length;
    budgetRead++;
    if (size > cap)
      fail(`budget: ${file} is ${size} B > cap ${cap} B (spec/meta-harness.md §2 R4)`);
  } catch {
    fail(`budget: ${file} missing`);
  }
}
if (budgetRead === budgeted.length) ok(`budgets checked (${budgeted.length} capped files)`);

// -- 3. boundaries + detectors (doc/omt-ts-methodology.md §5 + §16) ------------
function walk(rel: string, out: string[] = []): string[] {
  const abs = join(ROOT, rel);
  for (const entry of readdirSync(abs)) {
    const sub = `${rel}/${entry}`;
    if (statSync(join(ROOT, sub)).isDirectory()) walk(sub, out);
    else if (/\.m?tsx?$/.test(entry)) out.push(sub);
  }
  return out;
}

const srcFiles = walk('src');
const THREE_GLUE = ['src/main.ts', 'src/render/', 'src/world/', 'src/fx/', 'src/loaders/'];
const GATEWAYS = ['src/loaders/', 'src/core/persistence/'];
const VIEWS = ['src/render/', 'src/world/', 'src/fx/', 'src/ui/'];

const RX = {
  import: /['"]three(?:\/[A-Za-z0-9._/-]*)?['"]/,
  io: /\blocalStorage\b|\bfetch\s*\(/,
  dom: /\bdocument\s*\./,
  wallClock: /\bDate\.now\b|\bperformance\.now\b/,
  viewDI: /\bnew\s+[A-Z]\w*(Controller|Partner)\b/,
} as const;

function scan(files: string[], rx: RegExp, what: string, docRef: string): void {
  for (const f of files) {
    const lines = readFileSync(join(ROOT, f), 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (rx.test(lines[i])) {
        const snippet = lines[i].trim().slice(0, 60);
        fail(`${what}: ${f}:${i + 1} "${snippet}" (${docRef})`);
      }
    }
  }
}

const covered = (f: string, prefixes: readonly string[]): boolean =>
  prefixes.some((p) => f === p || f.startsWith(p));

scan(
  srcFiles.filter((f) => !covered(f, THREE_GLUE)),
  RX.import,
  'boundary — engine import outside glue/loaders',
  'doc/omt-ts-methodology.md §5',
);
scan(
  srcFiles.filter((f) => !covered(f, GATEWAYS)),
  RX.io,
  'boundary — IO outside gateway',
  'doc/omt-ts-methodology.md §7',
);
scan(
  srcFiles.filter((f) => covered(f, ['src/core/'])),
  RX.dom,
  'boundary — DOM write in controller',
  'doc/omt-ts-methodology.md §16 D4',
);
scan(
  srcFiles.filter((f) => covered(f, ['src/game/'])),
  RX.wallClock,
  'boundary — wall clock in model',
  'doc/omt-ts-methodology.md §16 D6',
);
scan(
  srcFiles.filter((f) => covered(f, VIEWS)),
  RX.viewDI,
  'boundary — view builds controller/partner',
  'doc/omt-ts-methodology.md §16 D5',
);
if (failures === 0) ok('boundaries checked (import + io + dom + wallclock + DI)');

// -- 4. TA digest (R3) — informational, never fails the run --------------------
const taFiles = [...walk('src'), ...walk('tests')];
const tags: string[] = [];
for (const f of taFiles) {
  const lines = readFileSync(join(ROOT, f), 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++)
    if (/\bTA:/.test(lines[i])) tags.push(`${f}:${i + 1}  ${lines[i].trim().slice(0, 90)}`);
}
console.log(`  · TA digest: ${tags.length} tag(s) (persistent R3 gotchas)`);
for (const t of tags) console.log(`    ${t}`);
if (tags.length === 0) console.log('  · (no TA tags yet — R3 carries them in comments)');

// -- verdict -------------------------------------------------------------------
console.log(failures === 0 ? 'harness: green' : `harness: ${failures} failure(s)`);
if (failures > 0) process.exit(1);
