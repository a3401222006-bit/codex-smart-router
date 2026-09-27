---
name: codex-smart-router
description: Recommend a GPT-6 model and reasoning effort for a task, or route a new Codex CLI session. Use when choosing between Luna, Sol and Astra or explicitly requesting cost-aware task routing.
---

# Codex Smart Router

Choose the least costly tier likely to finish the user's task correctly. Respect an explicit model or effort choice. Model availability depends on the current host and account; use the host's model list when available.

| Task | Starting recommendation |
| --- | --- |
| Mechanical edits, formatting, simple classification | GPT-6 Luna / low |
| Focused analysis requiring verification | GPT-6 Luna / medium or high |
| Everyday development and debugging | GPT-6 Sol / medium |
| Unclear bugs or multi-file work | GPT-6 Sol / high |
| Difficult diagnosis, architecture, cross-module reasoning | GPT-6 Astra / high |
| Exceptionally demanding work | GPT-6 Astra / xhigh |

These are starting heuristics, not benchmark guarantees. Consider complexity and cost of failure, not just prompt length. Reserve max for an explicit need. The helper intentionally uses low through max, a conservative subset; do not assume API-only effort values or host-specific ultra are portable.

## Desktop ChatGPT / Codex

Reassess the model at each substantive task boundary in an ongoing chat, and when new evidence makes the current task materially harder or easier (for example, a routine fix expands into cross-module diagnosis, or the hard part is finished and only formatting remains). Compare the task with the current model and effort when those settings are available. Proactively give one concise upgrade or downgrade recommendation only when it would materially improve quality or cost; include the target model, effort, and reason. Do not repeat an unchanged recommendation or spend an extra classifier call on each turn. Respect explicit model choices and a request to stop suggestions.

The skill cannot change the current desktop chat's model picker. When a switch is useful, tell the user the setting to choose in the model picker or via `/model` and `/reasoning` where available. Do not claim that a recommendation performed a switch. Continue authorized work with the current model unless the user directs otherwise. If the current model is not visible, describe the recommendation conditionally rather than claiming a mismatch.

If the user requests a measured routing pass, run `node <skill-dir>/scripts/router.mjs --route --json "task"`. This calls the authenticated Codex CLI once and consumes Codex usage. It does not run the task. If local execution or CLI access is unavailable, provide the recommendation inline and disclose that it was not CLI-verified. Do not create chats or spawn agents merely to implement routing.

## Terminal launcher

Run `node <skill-dir>/scripts/router.mjs --help` for current options. Use `--route` from tools without a terminal. Start an interactive session only in an interactive terminal when requested. `--model gpt-6-sol --effort high` skips the routing call; `--profile legacy` explicitly opts into the GPT-5.6 family. The catalog is an allowlist, not live proof of account access.

Do not retry authentication, quota, or model-access failures indefinitely or silently downgrade after them. Report unfinished work. An invalid successful routing response falls back visibly to Sol/medium (Terra/medium in legacy mode).

## Optional Jev judgments

Jev is separate from Codex model selection. Use it for bounded Choice/Noul/Score judgments when requested or appropriate to an authorized workflow, not for every chat turn. For actual integration, read the installed TypeSafe skill if available and the [live TypeSafe docs](https://docs.typesafe.ai/llms.txt). Use official HTTP/SDK interfaces only. The router helper does not call Jev.

Keep `TYPESAFE_API_KEY` in the execution environment or a credential store. Never print it or include it in task text. On an explicit credit-exhaustion response, tell the user which work is incomplete, stop retries, and disclose any Codex-only continuation. A rate limit is not automatically exhausted credits. There is no background balance monitor or advance warning.
