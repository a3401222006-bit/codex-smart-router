import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { ROUTES, FALLBACK, ROUTER, parseArgs, selectRoute, routingPrompt, isAutoRoute } from '../scripts/router.mjs';

// Fake Codex run: writes `reply` to the -o file the router passes.
const fakeRun = (reply, status = 0) => (_cmd, args) => {
  writeFileSync(args[args.indexOf('-o') + 1], reply);
  return { status };
};

test('routing table is a strict cost-efficiency frontier', () => {
  const sorted = [...ROUTES].sort((a, b) => a.cost - b.cost);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i].score > sorted[i - 1].score, `${sorted[i].model}/${sorted[i].effort} is dominated`);
  }
});

test('expensive pairs are explicit-only', () => {
  assert.equal(isAutoRoute({ model: 'gpt-6.1-sol', effort: 'max' }), false);
  assert.equal(isAutoRoute({ model: 'gpt-6-astra', effort: 'max' }), false);
  assert.equal(isAutoRoute({ model: 'gpt-6.1-sol', effort: 'medium' }), true);
});

test('router call uses the cheapest pair and the fallback is on the frontier', () => {
  const cheapest = [...ROUTES].sort((a, b) => a.cost - b.cost)[0];
  assert.deepEqual(ROUTER, { model: cheapest.model, effort: cheapest.effort });
  assert.ok(isAutoRoute(FALLBACK));
});

test('valid router reply is accepted', () => {
  const r = selectRoute(parseArgs(['fix a bug']), ['codex'], fakeRun('{"model":"gpt-6.1-sol","effort":"high"}'));
  assert.deepEqual(r, { model: 'gpt-6.1-sol', effort: 'high', source: 'router' });
});

test('off-frontier or explicit-only reply falls back', () => {
  for (const reply of ['{"model":"gpt-6-astra","effort":"high"}', '{"model":"gpt-6.1-sol","effort":"max"}', 'nonsense']) {
    const r = selectRoute(parseArgs(['task']), ['codex'], fakeRun(reply));
    assert.equal(r.source, 'fallback');
    assert.equal(r.model, FALLBACK.model);
  }
});

test('routing failure throws instead of guessing', () => {
  assert.throws(() => selectRoute(parseArgs(['task']), ['codex'], fakeRun('', 1)), /Routing failed/);
});

test('explicit choice is respected, with a warning when off the frontier', () => {
  const on = selectRoute(parseArgs(['--model', 'gpt-6.1-sol', '--effort', 'max', 'x']), null);
  assert.equal(on.source, 'explicit');
  assert.equal(on.warning, undefined);
  const off = selectRoute(parseArgs(['--model', 'gpt-6-astra', '--effort', 'high', 'x']), null);
  assert.match(off.warning, /off the cost-efficiency frontier/);
});

test('prompt offers only automatic pairs', () => {
  const p = routingPrompt('task');
  assert.match(p, /gpt-6\.1-sol\/medium/);
  assert.doesNotMatch(p, /gpt-6-astra/);
  assert.doesNotMatch(p, /gpt-6\.1-sol\/max/);
});

test('removed --profile option is rejected', () => {
  assert.throws(() => parseArgs(['--profile', 'legacy', 'x']), /Unknown option/);
});

test('SKILL.md table matches ROUTES', () => {
  const skill = readFileSync(new URL('../SKILL.md', import.meta.url), 'utf8');
  for (const r of ROUTES) assert.ok(skill.includes(`${r.model} / ${r.effort}`), `${r.model} / ${r.effort} missing in SKILL.md`);
});
