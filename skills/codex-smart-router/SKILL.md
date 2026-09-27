---
name: codex-smart-router
description: Recommend GPT-6 Luna, Sol or Astra and reasoning effort as task difficulty changes, or route a new Codex CLI session.
---

# Codex Smart Router

Recommend the least costly model likely to succeed. Respect explicit model/effort choices and the host's available models.

| Task | Starting point |
| --- | --- |
| Mechanical work, formatting | Luna / low |
| Focused work needing verification | Luna / medium or high |
| Everyday coding and debugging | Sol / medium |
| Unclear bug or multi-file change | Sol / high |
| Difficult diagnosis or architecture | Astra / high |
| Exceptionally demanding work | Astra / xhigh |

Reassess at each substantive task boundary and when difficulty materially changes. Suggest an upgrade or downgrade only when quality or cost would change meaningfully; give the target model, effort and reason once. Do not run a classifier on every turn. Continue the task while suggesting a switch.

In desktop chats, this skill cannot switch the active model. Point to the model picker or `/model` and `/reasoning`; never claim a switch happened. If the current model is unknown, make the recommendation conditional. Do not create chats or agents merely to route.

For a live CLI recommendation, run `node <skill-dir>/scripts/router.mjs --route --json "task"` only when requested; it consumes a separate Codex call. For a new interactive CLI task, use `codex-smart`. See `--help` for options. On auth, quota or access failure, report it and stop rather than silently downgrade. A malformed successful route visibly falls back to Sol/medium (Terra/medium with `--profile legacy`).

Jev is independent of model routing and is not called by this helper. Use Choice/Noul/Score only for suitable authorized work. For actual calls, read the TypeSafe skill and [live docs](https://docs.typesafe.ai/llms.txt); use official HTTP/SDK. Never expose `TYPESAFE_API_KEY`. If credits are explicitly exhausted, stop retries and report incomplete work. A rate limit alone does not establish exhausted credits; there is no background balance monitor.
