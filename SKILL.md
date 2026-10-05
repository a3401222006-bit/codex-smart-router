---
name: codex-smart-router
description: Recommend the cheapest Codex model and reasoning effort likely to succeed — GPT-6 Luna for light work, GPT-6.1 Sol for real tasks — or route a new Codex CLI session.
---

# Codex Smart Router

Recommend the least costly model likely to succeed. Respect explicit model/effort choices and the host's available models.

## Routing table

Source: Artificial Analysis Intelligence Index v4.3.2 snapshot (2026-09-30). Score = capability index; cost = cost per index task, GPT-5.6 Luna / low = 1. Only the cost-efficiency frontier is kept: a pair is dropped when another pair scores at least as high for less. That removes every GPT-5.6 tier, every GPT-6 Sol tier and every GPT-6 Astra tier except max (for example Astra / high scores 51 at cost 173, while GPT-6.1 Sol / xhigh scores 51 at cost 39).

| Task | Route | Score / cost |
| --- | --- | --- |
| Mechanical work, formatting, renaming, one-line answers | gpt-6-luna / low | 21 / 0.45 |
| Light chat, simple rewriting, brief Q&A | gpt-6-luna / medium | 29 / 2 |
| Small focused work needing some checking | gpt-6-luna / high | 32 / 3 |
| Small work needing more care | gpt-6-luna / xhigh | 34 / 4 |
| Small but tricky reasoning | gpt-6-luna / max | 37 / 7 |
| Everyday code reading, small clear edits | gpt-6.1-sol / low | 42 / 13 |
| Everyday coding and debugging (default) | gpt-6.1-sol / medium | 48 / 21 |
| Unclear bug or multi-file change | gpt-6.1-sol / high | 50 / 32 |
| Difficult diagnosis, architecture, cross-module reasoning | gpt-6.1-sol / xhigh | 51 / 39 |
| Exceptionally demanding work (explicit only) | gpt-6.1-sol / max | 52 / 72 |
| Only when 6.1 Sol / max has failed (explicit only) | gpt-6-astra / max | 53 / 326 |

Start at the lowest row likely to succeed and move up one row only when the result is empty, shallow or self-contradictory. Do not escalate because the input is long. Do not suggest GPT-6 Sol, GPT-5.6 models or Astra below max: a frontier row is always cheaper for the same score. Scores are general benchmark results, not a guarantee for a specific task, and actual plan usage may not scale with the cost column.

Reassess at each substantive task boundary and when difficulty materially changes. Suggest an upgrade or downgrade only when quality or cost would change meaningfully; give the target model, effort and reason once. Do not run a classifier on every turn. Continue the task while suggesting a switch.

Do not promise a switch will consume fewer tokens: actual usage and cost depend on the plan, model availability, reasoning effort, and response length. If the user sees no meaningful cost or quality difference, recommend staying with the current model rather than switching repeatedly.

In desktop chats, this skill cannot switch the active model. Point to the model picker or `/model` and `/reasoning`; never claim a switch happened. If the current model is unknown, make the recommendation conditional. Do not create chats or agents merely to route.

For a live CLI recommendation, run `node <skill-dir>/scripts/router.mjs --route --json "task"` only when requested; it consumes a separate Codex call (gpt-6-luna / low, the cheapest row). For a new interactive CLI task, use `codex-smart`. Run `--models` to print the table. On auth, quota or access failure, report it and stop rather than silently downgrade. A malformed or off-table route visibly falls back to gpt-6.1-sol / medium. The router never picks the two explicit-only rows; pass `--model` and `--effort` for those.
