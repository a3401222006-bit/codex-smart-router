import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs, validateRoute, selectRoute, commandFor } from '../skills/codex-smart-router/scripts/router.mjs';

const script = resolve('skills/codex-smart-router/scripts/router.mjs');
function options(extra = []) { return parseArgs(['--route', ...extra, 'Fix a bug']); }
function respond(text, observe = () => {}) {
  return (cmd, args, opts) => {
    observe(cmd, args, opts);
    writeFileSync(args[args.indexOf('-o') + 1], text);
    return { status: 0 };
  };
}

test('GPT-6 default returns validated selection and cleans temporary files', () => {
  let dir;
  const r = selectRoute(options(), ['codex'], respond('{"model":"gpt-6-astra","effort":"high"}', (_, args, opts) => {
    dir = args[args.indexOf('-C') + 1];
    assert.equal(args[args.indexOf('-m') + 1], 'gpt-6-luna');
    assert.equal(args[args.indexOf('-s') + 1], 'read-only');
    assert.equal(args.at(-1), '-');
    assert.ok(opts.input.includes('Fix a bug'));
    assert.ok(!args.includes('Fix a bug'));
    assert.ok(!args.includes('--ignore-rules'));
  }));
  assert.deepEqual(r, { model: 'gpt-6-astra', effort: 'high', source: 'router' });
  assert.equal(existsSync(dir), false);
});

test('invalid successful output visibly falls back, including wrong-family models', () => {
  for (const value of ['garbage', '{"model":"gpt-6-astra","effort":"max"}', '{}', '{"model":"gpt-5.6-sol","effort":"high"}', '{"model":"gpt-6-luna","effort":"minimal"}']) {
    const r = selectRoute(options(), ['codex'], respond(value));
    assert.equal(r.model, 'gpt-6-sol'); assert.equal(r.source, 'fallback'); assert.ok(r.warning);
  }
});

test('legacy profile is explicit and retains Terra fallback', () => {
  const r = selectRoute(options(['--profile', 'legacy']), ['codex'], respond('bad'));
  assert.equal(r.model, 'gpt-5.6-terra');
});

test('failed request never launches or silently falls back, and hides raw secrets', () => {
  let count = 0, dir;
  assert.throws(() => selectRoute(options(), ['codex'], (_, args) => {
    count++; dir = args[args.indexOf('-C') + 1];
    return { status: 1, stderr: 'private token' };
  }), e => /Routing failed/.test(e.message) && !e.message.includes('private token'));
  assert.equal(count, 1); assert.equal(existsSync(dir), false);
  assert.throws(() => selectRoute(options(), ['codex'], () => ({ error: { code: 'ETIMEDOUT' } })), /timed out/);
});

test('explicit model skips paid classifier and rejects invalid options', () => {
  const r = selectRoute(options(['--model', 'gpt-6-sol', '--effort', 'max']), null, () => { throw Error('must not call'); });
  assert.equal(r.source, 'explicit'); assert.equal(r.effort, 'max');
  for (const args of [['--effort','high'], ['--model','not-real'], ['--model','gpt-6-luna','--effort','minimal'], ['--json'], ['--timeout','NaN'], ['--profile','unknown']]) assert.throws(() => parseArgs(args));
  assert.throws(() => validateRoute({ model: 'gpt-6-astra', effort: 'none' }));
});

test('Windows npm shim resolves to node entrypoint without shell execution', () => {
  const dir = mkdtempSync(join(tmpdir(), 'codex shim '));
  try {
    const entry = join(dir, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
    mkdirSync(join(dir, 'node_modules', '@openai', 'codex', 'bin'), { recursive: true });
    writeFileSync(entry, '');
    assert.deepEqual(commandFor(join(dir, 'codex.cmd'), 'win32'), [process.execPath, entry]);
    assert.deepEqual(commandFor(join(dir, 'codex.exe'), 'win32'), [join(dir, 'codex.exe')]);
    assert.throws(() => commandFor(join(dir, 'missing', 'codex.cmd'), 'win32'), /Cannot resolve/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('end-to-end mock handles Unicode/metacharacters over stdin without executing task', () => {
  const dir = mkdtempSync(join(tmpdir(), 'router test '));
  try {
    const mock = join(dir, 'codex.mjs');
    const log = join(dir, 'input.txt');
    writeFileSync(mock, `import {readFileSync,writeFileSync} from 'node:fs';
const a=process.argv.slice(2);
if(a[0] !== 'exec') process.exit(9);
writeFileSync(${JSON.stringify(log)},readFileSync(0,'utf8'));
writeFileSync(a[a.indexOf('-o')+1],JSON.stringify({model:'gpt-6-luna',effort:'low'}));`);
    const task = '整理中文 $HOME `echo danger` & | "quotes"\nsecond line';
    const r = spawnSync(process.execPath, [script, '--route', '--json', '--stdin'], { input: task, encoding: 'utf8', env: { ...process.env, CODEX_BIN: mock } });
    assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).model, 'gpt-6-luna');
    assert.ok(readFileSync(log, 'utf8').includes(JSON.stringify(task)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('skill installer is portable, refuses overwrite, and backs up on explicit update', () => {
  const home = mkdtempSync(join(tmpdir(), 'router install '));
  try {
    const run = (...args) => spawnSync(process.execPath, ['scripts/install.mjs', '--home', home, ...args], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    const skill = join(home, '.agents', 'skills', 'codex-smart-router');
    const helper = join(skill, 'scripts', 'router.mjs');
    assert.ok(existsSync(join(skill, 'SKILL.md')));
    assert.equal(spawnSync(process.execPath, [helper, '--route', '--json', '--model', 'gpt-6-sol', 'test'], { encoding: 'utf8' }).status, 0);
    assert.equal(run().status, 1); assert.equal(run('--force').status, 0);
    if (process.platform === 'win32') {
      const r = spawnSync('pwsh', ['-NoProfile', '-File', join(home, '.local', 'bin', 'codex-smart.ps1'), '--route', '--model', 'gpt-6-sol', 'test'], { encoding: 'utf8' });
      assert.equal(r.status, 0, r.stderr);
    } else {
      const r = spawnSync(join(home, '.local', 'bin', 'codex-smart'), ['--route', '--model', 'gpt-6-sol', 'test'], { encoding: 'utf8' });
      assert.equal(r.status, 0, r.stderr);
    }
  } finally { rmSync(home, { recursive: true, force: true }); }
});


test('non-terminal task launch stops before spending classifier usage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'router no tty '));
  try {
    const mock = join(dir, 'codex.mjs');
    const marker = join(dir, 'called');
    writeFileSync(mock, `import {writeFileSync} from 'node:fs';writeFileSync(${JSON.stringify(marker)},'called');`);
    const r = spawnSync(process.execPath, [script, 'test'], { encoding: 'utf8', env: { ...process.env, CODEX_BIN: mock } });
    assert.equal(r.status, 1); assert.match(r.stderr, /needs a terminal/); assert.equal(existsSync(marker), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
