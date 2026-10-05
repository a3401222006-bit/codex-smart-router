import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { ROUTES, FALLBACK, LUNA_ROUTER, parseArgs, selectRoute, routingPrompt, triage, chooseMode, jevQuestions, KINDS } from '../scripts/router.mjs';

// Fake Codex run: writes `reply` to the -o file the router passes.
const fakeRun = (reply, status = 0) => (_cmd, args) => {
  writeFileSync(args[args.indexOf('-o') + 1], reply);
  return { status };
};
// Fake Jev response with the given features.
const fakeJev = ({ kind, difficulty, stakes, done = 0, kc = 0.9, dc = 0.9 }, status = 200) => async (url, init) => {
  assert.equal(url, 'https://api.typesafe.ai/v1/systemone');
  assert.match(init.headers.Authorization, /^Bearer /);
  return { ok: status === 200, status, json: async () => ({ answers: {
    kind: { choice: kind, confidence: kc }, difficulty: { score: difficulty, confidence: dc }, stakes: { score: stakes }, clear_done: { noul: done } } }) };
};
const noLuna = () => { throw new Error('Luna must not be called'); };
const T = (kind, difficulty, stakes, extra = {}) => { const { reasons, mode, ...r } = triage({ kind, difficulty, stakes, ...extra }); return r; };

test('routing table is a strict cost-efficiency frontier', () => {
  for (let i = 1; i < ROUTES.length; i++) {
    assert.ok(ROUTES[i].cost > ROUTES[i - 1].cost, 'ROUTES must be ordered by cost');
    assert.ok(ROUTES[i].score > ROUTES[i - 1].score, `${ROUTES[i].model}/${ROUTES[i].effort} is dominated`);
  }
});

test('difficulty picks the start; Luna only for checkable work', () => {
  assert.deepEqual(T('mechanical', 0.4, 0.3), { model: 'gpt-6-luna', effort: 'low' });
  assert.deepEqual(T('language', 1.4, 0.5), { model: 'gpt-6-luna', effort: 'medium' });
  assert.deepEqual(T('language', 3, 0.5), { model: 'gpt-6.1-sol', effort: 'high' });
  assert.deepEqual(T('knowledge', 0.5, 0.5), { model: 'gpt-6.1-sol', effort: 'low' }); // Luna hallucinates
  assert.deepEqual(T('coding', 2, 1), { model: 'gpt-6.1-sol', effort: 'medium' });
  assert.deepEqual(T('reasoning', 3.8, 0.8), { model: 'gpt-6.1-sol', effort: 'xhigh' });
});

test('stakes set a floor, like emergency triage', () => {
  assert.deepEqual(T('mechanical', 0.2, 2), { model: 'gpt-6.1-sol', effort: 'high' });     // e.g. ~/.ssh cleanup
  assert.deepEqual(T('coding', 3.8, 2), { model: 'gpt-6.1-sol', effort: 'xhigh' });       // floor never lowers
  assert.deepEqual(T('coding', 1, 2.9), { model: 'gpt-6.1-sol', effort: 'max' });
  assert.deepEqual(T('security', 1, 2.9), { model: 'gpt-6-astra', effort: 'max' });       // account compromise
  assert.match(triage({ kind: 'security', difficulty: 1, stakes: 2.9 }).reasons.join(), /stakes 2\.9/);
});

test('an unsure classifier gets the default, but the stakes floor still applies', () => {
  assert.deepEqual(T('mechanical', 0.2, 0.2, { kindConfidence: 0.3 }), FALLBACK);
  assert.deepEqual(T('security', 1, 2.9, { kindConfidence: 0.3 }), { model: 'gpt-6-astra', effort: 'max' });
});

test('Jev routing: one HTTP call, no Codex quota', async () => {
  const r = await selectRoute(parseArgs(['task']), null,
    { env: { TYPESAFE_API_KEY: 'k' }, fetchFn: fakeJev({ kind: 'security', difficulty: 2, stakes: 2.9 }), run: noLuna });
  assert.equal(r.source, 'jev');
  assert.deepEqual([r.model, r.effort], ['gpt-6-astra', 'max']);
});

test('Jev failure visibly falls back to Luna', async () => {
  const r = await selectRoute(parseArgs(['task']), ['codex'],
    { env: { TYPESAFE_API_KEY: 'k' }, fetchFn: fakeJev({}, 401), run: fakeRun('{"kind":"coding","difficulty":2,"stakes":1}') });
  assert.equal(r.source, 'luna');
  assert.match(r.warning, /HTTP 401/);
  assert.deepEqual([r.model, r.effort], ['gpt-6.1-sol', 'medium']);
});

test('without a key, Luna classifies at the cheapest pair', async () => {
  let args;
  const run = (c, a) => { args = a; return fakeRun('{"kind":"mechanical","difficulty":0,"stakes":0}')(c, a); };
  const r = await selectRoute(parseArgs(['task']), ['codex'], { env: {}, run });
  assert.equal(r.source, 'luna');
  assert.equal(args[args.indexOf('-m') + 1], LUNA_ROUTER.model);
  assert.deepEqual([r.model, r.effort], ['gpt-6-luna', 'low']);
});

test('malformed classifier output falls back; routing failure throws', async () => {
  const bad = await selectRoute(parseArgs(['task']), ['codex'], { env: {}, run: fakeRun('nonsense') });
  assert.equal(bad.source, 'fallback');
  await assert.rejects(selectRoute(parseArgs(['task']), ['codex'], { env: {}, run: fakeRun('', 1) }), /Routing failed/);
});

test('explicit choice is respected, with a warning when off the frontier', async () => {
  const on = await selectRoute(parseArgs(['--model', 'gpt-6.1-sol', '--effort', 'max', 'x']), null);
  assert.equal(on.source, 'explicit');
  assert.equal(on.warning, undefined);
  const off = await selectRoute(parseArgs(['--model', 'gpt-6-astra', '--effort', 'high', 'x']), null);
  assert.match(off.warning, /off the cost-efficiency frontier/);
});

test('Luna prompt and Jev questions share the same features', () => {
  const p = routingPrompt('task');
  for (const k of Object.keys(KINDS)) assert.match(p, new RegExp(`- ${k}:`));
  assert.deepEqual(Object.keys(jevQuestions()), ['kind', 'difficulty', 'stakes', 'clear_done']);
  assert.throws(() => parseArgs(['--router', 'gpt', 'x']), /jev or luna/);
});

test('SKILL.md table matches ROUTES', () => {
  const skill = readFileSync(new URL('../SKILL.md', import.meta.url), 'utf8');
  for (const r of ROUTES) assert.ok(skill.includes(`${r.model} / ${r.effort}`), `${r.model} / ${r.effort} missing in SKILL.md`);
});

test('mode: plan for vague hard work, goal only with a checkable finish line, never in an emergency', () => {
  assert.equal(chooseMode({ difficulty: 0.5, stakes: 0.2, clearDone: 0.9 }), 'normal');          // small task
  assert.equal(chooseMode({ difficulty: 3, stakes: 1, clearDone: 0.1 }), 'plan');                // "design the architecture"
  assert.equal(chooseMode({ difficulty: 2.5, stakes: 1, clearDone: 0.88 }), 'goal');             // "...until pytest passes"
  assert.equal(chooseMode({ difficulty: 2.5, stakes: 2, clearDone: 0.88 }), 'plan-then-goal');   // high stakes: review the plan
  assert.equal(chooseMode({ difficulty: 3, stakes: 2.9, clearDone: 0.9 }), 'normal');            // emergency: stay hands-on
});

test('Jev clear_done reaches the mode', async () => {
  const r = await selectRoute(parseArgs(['task']), null,
    { env: { TYPESAFE_API_KEY: 'k' }, fetchFn: fakeJev({ kind: 'coding', difficulty: 2.6, stakes: 1, done: 0.9 }), run: noLuna });
  assert.equal(r.mode, 'goal');
});
