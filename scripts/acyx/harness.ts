/**
 * The ONE check script — spec/meta-harness.md §3. Wired as `npm run harness`.
 * Node ≥ 22 native TypeScript (type-stripping); Node std-lib only.
 *
 * Enforces (each failure ⇒ exit 1 with a one-line pointer):
 *   1. typecheck (tsc --noEmit) + tests (vitest run)              — R5
 *   2. budgets (R4)     — caps mirrored from spec/meta-harness.md §2 R4
 *   3. boundaries       — policy mirrored from doc/omt-ts-methodology.md
 *                         §5 + §16: D1 engine-imports, D3 io-gateways,
 *                         D4 DOM-in-controller, D5 view-built controllers,
 *                         D6 wall-clock-in-model (D2 is review-time)
 *   4. TA digest        — count + locations of persistent gotchas (R3)
 *   5. context (R6)     — every tracked folder carries CONTEXT.md ≤ 2 KiB
 *   6. ledger (R1)      — WORK.md row lint + src-touching-commit audit +
 *                         commit-format gate, since the paper layer went
 *                         live (epoch `659446c` — earlier commits exempt)
 *   7. spec status (R2) — src/ citations resolve to a spec whose Status is
 *                         ≥ agreed; spec/README.md index in sync with every
 *                         spec's own Status line
 *   8. TA guard (R3)    — a TA: tag at HEAD missing in the working tree
 *                         fails unless the file carries a `TA-:` note
 *   9. transport        — git remotes: exactly `origin`; every config
 *                         `branch.*.remote` points at `origin`
 * Keep the mirrored values in sync with their spec/methodology parents.
 *
 * TA: runs via node type-stripping — enums / parameter-properties are NOT
 *     erasable syntax; keep plain fields in this script only.
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

/** Recursively list .ts/.tsx/.mts/.cts files; skip hidden/build dirs. */
function walk(rel: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(join(ROOT, rel));
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist')
      continue;
    const sub = `${rel}/${entry}`;
    if (statSync(join(ROOT, sub)).isDirectory()) walk(sub, out);
    else if (/\.m?tsx?$/.test(entry)) out.push(sub);
  }
  return out;
}

// -- 1. typecheck + tests (R5) -------------------------------------------------
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
  specRef: /\bspec\/[a-z0-9-]+\.md\b/,
  taTag: /\bTA:/,
  taRetired: /\bTA-:/,
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
const taDomain = [...walk('src'), ...walk('tests'), ...walk('scripts/acyx')];
const readLines = (f: string): string[] => readFileSync(join(ROOT, f), 'utf8').split('\n');

{
  const tags: string[] = [];
  for (const f of taDomain) {
    const lines = readLines(f);
    for (let i = 0; i < lines.length; i++)
      if (RX.taTag.test(lines[i])) tags.push(`${f}:${i + 1}  ${lines[i].trim().slice(0, 90)}`);
  }
  console.log(`  · TA digest: ${tags.length} tag(s) (persistent R3 gotchas)`);
  for (const t of tags) console.log(`    ${t}`);
  if (tags.length === 0) console.log('  · (no TA tags yet — R3 carries them in comments)');
}

// -- 5. context (R6) — per-folder CONTEXT.md nav maps --------------------------
const gitLs = spawnSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' });
if (gitLs.status !== 0) fail('context: git ls-files failed — presence not checked');
else {
  const folders = new Set<string>();
  for (const rel of gitLs.stdout.split('\n')) {
    if (!rel) continue;
    let dir = '';
    for (const part of rel.split('/').slice(0, -1)) {
      dir = dir ? `${dir}/${part}` : part;
      if (!dir.startsWith('.sandbox')) folders.add(dir);
    }
  }
  let maps = 0;
  for (const dir of [...folders].sort()) {
    const map = `${dir}/CONTEXT.md`;
    try {
      const size = readFileSync(join(ROOT, map)).length;
      if (size > 2048)
        fail(`context: ${map} is ${size} B > cap 2048 B (spec/meta-harness.md §2 R6)`);
      else maps++;
    } catch {
      fail(`context: ${map} missing — land it with the folder (AGENTS.md §Navigation, R6)`);
    }
  }
  if (maps > 0) ok(`context maps present + within budget (${maps} folders)`);
}

// -- 6. ledger (R1) — WORK.md row lint + commit audit --------------------------
// Row grammar: | date | [ ]|[~]|[x] | task | spec | evidence | — a [x] row
// must carry a commit ref. Audit window: commits since the paper layer went
// live (epoch 659446c … HEAD): every src-touching commit hash appears in a
// WORK.md evidence cell; every subject matches <tag>(<area>): <subject>.
const EPOCH = '659446c'; // last pre-paper-layer commit (spec §2 R1 — mirrored)
const MARKERS = new Set(['[ ]', '[~]', '[x]']);
const workText = readFileSync(join(ROOT, 'WORK.md'), 'utf8');

let rows = 0;
for (const raw of workText.split('\n')) {
  const line = raw.trim();
  if (!line.startsWith('|')) continue;
  const cells = line.split('|').map((c) => c.trim());
  if (cells.length < 6) continue;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cells[1])) continue; // header/separator rows
  rows++;
  const [date, marker, task, spec, evidence] = cells.slice(1, 6);
  if (!MARKERS.has(marker))
    fail(`ledger: WORK.md row ${date} has invalid marker "${marker}" — use [ ] / [~] / [x] (R1)`);
  if (!task) fail(`ledger: WORK.md ${date} ${marker} empty task cell (R1)`);
  if (!spec)
    fail(`ledger: WORK.md ${date} ${marker} empty spec cell — done rows keep a spec pointer (R1)`);
  if (marker === '[x]' && !/\b[0-9a-f]{7,9}\b/.test(evidence))
    fail(`ledger: WORK.md ${date} [x] row without a commit ref in evidence (R1)`);
}
if (rows === 0) fail('ledger: WORK.md has no task rows — R1 table missing?');
else if (failures === 0) ok(`ledger lint green (${rows} rows, R1 grammar)`);

const gitLog = spawnSync(
  'git',
  ['log', '--format=%H|%h|%s', '--name-only', `${EPOCH}..HEAD`],
  { cwd: ROOT, encoding: 'utf8' },
);
if (gitLog.status !== 0 || !gitLog.stdout) {
  fail(`ledger: commit audit unavailable — git log ${EPOCH}..HEAD failed (check epoch anchor)`);
} else {
  type Commit = { hash: string; subject: string; touchesSrc: boolean };
  const commits: Commit[] = [];
  for (const line of gitLog.stdout.split('\n')) {
    if (/^[0-9a-f]{40}\|/.test(line)) {
      const parts = line.split('|');
      commits.push({ hash: parts[1], subject: parts.slice(2).join('|'), touchesSrc: false });
    } else if (line && commits.length && line.startsWith('src/')) {
      commits[commits.length - 1].touchesSrc = true;
    }
  }
  const FORMAT = /^(feat|fix|refactor|test|docs|art|state)\([a-z0-9._/-]+\): \S/;
  let audited = 0;
  for (const c of commits) {
    audited++;
    if (!/^merge\b/i.test(c.subject) && !FORMAT.test(c.subject))
      fail(`ledger: commit ${c.hash} "${c.subject.slice(0, 50)}" breaks <tag>(<area>): <subject> (R1)`);
    if (c.touchesSrc && !workText.includes(c.hash))
      fail(`ledger: src-touching commit ${c.hash} not declared in WORK.md (R1)`);
  }
  if (failures === 0) ok(`commit audit green (${audited} commits since ${EPOCH})`);
}

// -- 7. spec status gate (R2) — affiliations, citations, index sync -----------
// Affiliation = a spec/<name>.md citation inside a src/ file's top comment
// block ("this file implements spec X") ⇒ cited spec must be ≥ agreed.
// Body citations are pointers ⇒ existence-checked only. Index: spec/README.md
// must list every spec/*.md with the same status word as its own Status line.
const statusWord = (text: string): string | null => {
  const m = /^Status:\s*(.+)/m.exec(text);
  return m ? m[1].replace(/\*/g, '').trim().split(/\s+/)[0].toLowerCase() : null;
};

for (const f of srcFiles) {
  const lines = readLines(f);
  let inHeader = true; // top-of-file comment block = the affiliation zone
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inHeader && !/^\s*(\/\/|\*|\/\*|\*\/|$)/.test(line)) inHeader = false;
    for (const ref of line.match(/spec\/[a-z0-9-]+\.md/g) ?? []) {
      let text: string;
      try {
        text = readFileSync(join(ROOT, ref), 'utf8');
      } catch {
        fail(`spec gate: ${f}:${i + 1} cites ${ref} — file does not exist (R2)`);
        continue;
      }
      if (!inHeader) continue; // body pointer — not an implementation claim
      const st = statusWord(text);
      if (st === null) fail(`spec gate: ${ref} (cited ${f}:${i + 1}) has no Status line (R2)`);
      else if (st !== 'agreed' && st !== 'implemented' && st !== 'frozen')
        fail(
          `spec gate: ${f}:${i + 1} implements ${ref} whose status is "${st}" — bump to agreed first (R2)`,
        );
    } 
  }
}

const specs = readdirSync(join(ROOT, 'spec'))
  .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'CONTEXT.md')
  .sort();
const indexText = readFileSync(join(ROOT, 'spec/README.md'), 'utf8');
const indexed = new Map<string, string>();
for (const line of indexText.split('\n')) {
  const m = /^\|\s*`([a-z0-9-]+\.md)`?\s*\|[^|]*\|\s*([A-Za-z-]+)\s*\|/.exec(line);
  if (m) indexed.set(m[1], m[2].toLowerCase());
}
for (const s of specs) {
  if (!indexed.has(s)) fail(`spec gate: spec/${s} missing from spec/README.md index (R2)`);
  else if (indexed.get(s) !== statusWord(readFileSync(join(ROOT, `spec/${s}`), 'utf8')))
    fail(
      `spec gate: spec/${s} index status "${indexed.get(s)}" != own Status line (spec/README.md sync, R2)`,
    );
}
if (failures === 0) ok('spec status gate green (citations + index sync)');

// -- 8. TA guard (R3) — tags are never deleted silently ------------------------
// A TA: tag present at HEAD but absent from the working tree fails unless the
// file now carries a TA-: removal note. Tag identity = text after "TA:"
// (whitespace-trimmed, first 60 chars) so relocating a tag is not removal.
const taKey = (line: string): string | null => {
  const i = line.indexOf('TA:');
  return i >= 0 ? line.slice(i + 3).trim().slice(0, 60) : null;
};
const guarded = new Set<string>();
for (const f of taDomain) {
  const head = spawnSync('git', ['show', `HEAD:${f}`], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (head.status !== 0) continue; // untracked / new file — nothing to guard
  const headTags = new Set<string>();
  for (const line of head.stdout.split('\n')) {
    const k = taKey(line);
    if (k) headTags.add(k);
  }
  if (headTags.size === 0) continue;
  const treeTags = new Set<string>();
  let hasNote = false;
  for (const line of readLines(f)) {
    const k = taKey(line);
    if (k) treeTags.add(k);
    if (RX.taRetired.test(line)) hasNote = true;
  }
  const gone = [...headTags].filter((k) => !treeTags.has(k));
  if (gone.length > 0 && !hasNote) {
    fail(
      `TA guard: removed from ${f} without a "TA-:" note — tags are never deleted silently (R3)`,
    );
    guarded.add(`${f} (${gone.length})`);
  }
}
if (guarded.size === 0) ok('TA guard green (HEAD tags intact or noted)');

// -- 9. transport (v1.3) — origin-only remotes ---------------------------------
const remoteOut = spawnSync('git', ['remote'], { cwd: ROOT, encoding: 'utf8' });
if (remoteOut.status !== 0) fail('transport: git remote failed');
else {
  const names = remoteOut.stdout.split(/\s+/).filter(Boolean);
  if (!names.includes('origin')) fail('transport: no origin remote — origin-only policy violated');
  const others = names.filter((n) => n !== 'origin');
  if (others.length > 0)
    fail(`transport: non-origin remote(s) ${others.join(', ')} — remotes are origin-only (v1.3)`);
  const branchOut = spawnSync('git', ['config', '--local', '--get-regexp', '^branch\\..*\\.remote$'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (branchOut.status === 0)
    for (const line of branchOut.stdout.split('\n').filter(Boolean)) {
      const v = line.split(' ')[1] ?? '';
      if (v !== 'origin')
        fail(`transport: ${line.split(' ')[0]} targets "${v}", not origin (v1.3)`);
    }
  if (names.length > 0 && others.length === 0) ok(`transport green (${names.length} remote: origin)`);
}

// -- verdict -------------------------------------------------------------------
console.log(failures === 0 ? 'harness: green' : `harness: ${failures} failure(s)`);
if (failures > 0) process.exit(1);
