---
name: codex-smart-router
description: Recommend the cheapest Codex model and reasoning effort likely to succeed, triaged by task kind, difficulty and stakes — GPT-6 Luna for checkable light work, GPT-6.1 Sol for real tasks, a higher floor for accounts, keys, network and emergencies — or route a new Codex CLI session.
---

# Codex Smart Router

Recommend the least costly model likely to succeed. Respect explicit model/effort choices and the host's available models.

## Routing table

Source: Artificial Analysis Intelligence Index v4.3.2 snapshot (2026-09-30). Score = capability index; cost = cost per index task, GPT-5.6 Luna / low = 1. Only the cost-efficiency frontier is kept: a pair is dropped when another pair scores at least as high for less. That removes every GPT-5.6 tier, every GPT-6 Sol tier and every GPT-6 Astra tier except max (for example Astra / high scores 51 at cost 173, while GPT-6.1 Sol / xhigh scores 51 at cost 39).

| Route | Score / cost | Used for |
| --- | --- | --- |
| gpt-6-luna / low | 21 / 0.45 | Mechanical work with checkable output: rename, reformat, extract |
| gpt-6-luna / medium | 29 / 2 | Translating, rewriting or summarising given text |
| gpt-6-luna / high | 32 / 3 | The same, needing more care |
| gpt-6-luna / xhigh | 34 / 4 | Explicit use only |
| gpt-6-luna / max | 37 / 7 | Explicit use only |
| gpt-6.1-sol / low | 42 / 13 | Factual questions, explaining an error, small clear edits |
| gpt-6.1-sol / medium | 48 / 21 | Everyday coding and debugging (default) |
| gpt-6.1-sol / high | 50 / 32 | Unclear bugs, multi-file work; floor for high-stakes work |
| gpt-6.1-sol / xhigh | 51 / 39 | Difficult diagnosis, architecture, derivations |
| gpt-6.1-sol / max | 52 / 72 | Critical emergencies that are not security work |
| gpt-6-astra / max | 53 / 326 | Critical security emergencies |

## Triage: difficulty, kind and stakes

Route like an emergency department: describe the task first, then let fixed rules choose.

1. **Kind** decides the model family. Use Luna only for mechanical and language work, whose output is easy to check. Do not use Luna for factual answers, code or security: it hallucinates far more than 6.1 Sol (AA-Omniscience 77% vs 54%) and trails it by about 19 points on the AA Coding Agent Index (41 vs 60).
2. **Difficulty** (0 trivial – 4 very hard) sets the starting effort. Luna: below 1 low, below 2 medium, below 2.5 high, otherwise 6.1 Sol. 6.1 Sol: below 1.5 low, below 2.5 medium, below 3.5 high, otherwise xhigh.
3. **Stakes** (0 none – 3 critical emergency) set a floor that difficulty can never lower. At 1.6 or above (accounts, passwords, keys, network or system configuration, money, personal data, work to be submitted or deployed) use at least 6.1 Sol / high. At 2.5 or above (an active security incident or account compromise, data being lost, a needed system down) use 6.1 Sol / max, or GPT-6 Astra / max when the work is security. Astra's general score is only 1 point higher, but on security it leads by a wide margin (novel-vulnerability ExploitBench port 39.0% vs 21.5%, ExploitGym 42.4% vs 35.1%), and in an emergency a wrong first answer costs more than the extra usage.
4. If the classifier is unsure of kind or difficulty (confidence below 0.5), use the default 6.1 Sol / medium; the stakes floor still applies.

## Plan and goal modes (interactive Codex)

Codex has two interactive modes: `/plan` designs before acting, and `/goal` keeps working toward a fixed objective, auditing evidence before it stops. Triage also returns a `mode`:

| Mode | When | Why |
| --- | --- | --- |
| normal | difficulty below 2, or stakes 2.5+ | Small tasks need neither. An emergency stays hands-on, step by step, rather than running autonomously. |
| plan | difficulty 2+, no checkable finish line | Pin down scope and a finish condition first ("optimise the code", "design the architecture", "the login button does nothing"). |
| goal | difficulty 2+, a checkable finish line (`clear_done` 0.7+) | e.g. "…until pytest passes", "…verified by tests/test_capture.py". |
| plan-then-goal | as goal, but stakes 1.6+ | Review the plan before letting it run. |

`clear_done` is a Jev noul (or a Luna boolean): does the task state a finish condition someone could verify objectively? Ask it with one task per request; batching several tasks into one state blurs the answers. Modes are recommendations; this helper does not switch modes for you.

Outside an emergency, start at the route triage gives and move up one row only when the result is empty, shallow or self-contradictory. Do not escalate because the input is long. Do not suggest GPT-6 Sol, GPT-5.6 models or Astra below max: a frontier row is always cheaper for the same score. Scores are general benchmark results, not a guarantee for a specific task, and actual plan usage may not scale with the cost column.

Reassess at each substantive task boundary and when difficulty materially changes. Suggest an upgrade or downgrade only when quality or cost would change meaningfully; give the target model, effort and reason once. Do not run a classifier on every turn. Continue the task while suggesting a switch.

Do not promise a switch will consume fewer tokens: actual usage and cost depend on the plan, model availability, reasoning effort, and response length. If the user sees no meaningful cost or quality difference, recommend staying with the current model rather than switching repeatedly.

In desktop chats, this skill cannot switch the active model. Point to the model picker or `/model` and `/reasoning`; never claim a switch happened. If the current model is unknown, make the recommendation conditional. Do not create chats or agents merely to route.

For a live CLI recommendation, run `node <skill-dir>/scripts/router.mjs --route --json "task"` only when requested. With `TYPESAFE_API_KEY` set it classifies the task with one Jev call (no Codex usage); otherwise, or if Jev fails, it uses a separate Codex call at gpt-6-luna / low. For a new interactive CLI task, use `codex-smart`. Run `--models` to print the table. On auth, quota or access failure, report it and stop rather than silently downgrade. A malformed classification visibly falls back to gpt-6.1-sol / medium.
