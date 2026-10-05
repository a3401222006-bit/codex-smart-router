# codex-smart-router

Cost-aware routing for the Codex CLI. A cheap classifier describes the task (kind, difficulty, stakes), fixed triage rules pick the least costly model and reasoning effort likely to finish it, and the interactive Codex CLI starts with that choice. The classifier is [Jev](https://docs.typesafe.ai) when `TYPESAFE_API_KEY` is set (one HTTP call, no Codex usage), otherwise GPT-6 Luna / low. It also ships as a Codex skill (`SKILL.md`) that recommends a model inside a chat.

## Routing table

Source: Artificial Analysis Intelligence Index v4.3.2 snapshot (2026-09-30). Score = capability index; cost = cost per index task, normalised so GPT-5.6 Luna / low = 1.

Only the cost-efficiency frontier is used: a model/effort pair is dropped when another pair scores at least as high for less. That removes every GPT-5.6 tier, every GPT-6 Sol tier and every GPT-6 Astra tier except max. For example, Astra / high scores 51 at cost 173, while GPT-6.1 Sol / xhigh scores 51 at cost 39.

| Route | Score | Cost |
| --- | ---: | ---: |
| gpt-6-luna / low | 21 | 0.45 |
| gpt-6-luna / medium | 29 | 2 |
| gpt-6-luna / high | 32 | 3 |
| gpt-6-luna / xhigh | 34 | 4 |
| gpt-6-luna / max | 37 | 7 |
| gpt-6.1-sol / low | 42 | 13 |
| gpt-6.1-sol / medium | 48 | 21 |
| gpt-6.1-sol / high | 50 | 32 |
| gpt-6.1-sol / xhigh | 51 | 39 |
| gpt-6.1-sol / max | 52 | 72 |
| gpt-6-astra / max | 53 | 326 |

## Triage

Routing works like an emergency department: the classifier only describes the task, and `triage()` in `scripts/router.mjs` decides.

- **Kind picks the model family.** Mechanical and language work, whose output is easy to check, goes to Luna. Everything else (factual answers, code, reasoning, security) goes to 6.1 Sol. Luna hallucinates far more (AA-Omniscience 77% vs 54%) and trails on the AA Coding Agent Index (41 vs 60).
- **Difficulty (0–4) sets the starting effort**, from low to xhigh.
- **Stakes (0–3) set a floor** that difficulty never lowers:
  - From 1.6 (accounts, keys, network or system configuration, money, personal data, work to be submitted or deployed): at least 6.1 Sol / high.
  - From 2.5 (an active security incident, account compromise, data loss, a needed system down): 6.1 Sol / max, or GPT-6 Astra / max for security work. Astra leads 6.1 Sol by a wide margin on hard security evaluations (ExploitBench novel-vulnerability port 39.0% vs 21.5%), even though its general score is only 1 point higher.
- **Unsure classifier:** if it is unsure of kind or difficulty, the default `gpt-6.1-sol / medium` is used, and the stakes floor still applies.

Example decisions with Jev:

| Task | Route | Why |
| --- | --- | --- |
| Replace "colour" with "color" in the README | gpt-6-luna / low | mechanical, difficulty 0.4 |
| Translate a CV into English | gpt-6-luna / medium | language, difficulty 1.4 |
| How long can I stay in the UK after graduating? | gpt-6.1-sol / low | factual, so not Luna |
| Derive the transient heat equation for a pulsed PCM cell | gpt-6.1-sol / xhigh | reasoning, difficulty 3.8 |
| Check tomorrow's coursework code for bugs | gpt-6.1-sol / high | stakes 2.0 floor |
| Unknown-location login alert, API keys in the repo | gpt-6-astra / max | security emergency, stakes 2.9 |

A failed Jev call falls back to Luna with a warning. A failed Luna call (auth, quota, network) stops without starting the task. A malformed classification falls back to `gpt-6.1-sol / medium`.

Scores are general benchmark results, not a guarantee for any specific task, and actual plan usage may not scale with the cost column. When new data is published, update `ROUTES` in `scripts/router.mjs` and the table in `SKILL.md` together; a test checks that they match.

## Requirements

- Node.js 18 or newer, and `zsh` for the `bin/codex-smart` launcher
- Codex CLI on `PATH`, or `CODEX_BIN` set to its executable path
- An authenticated Codex CLI session (`codex login`)

On macOS the router also finds the Codex CLI bundled with the ChatGPT or Codex desktop app, under `/Applications/ChatGPT.app/Contents/Resources/codex-cli/`.

## Install

```zsh
git clone https://github.com/a3401222006-bit/codex-smart-router.git
cd codex-smart-router
mkdir -p ~/.local/bin
ln -sf "$PWD/bin/codex-smart" ~/.local/bin/codex-smart
```

Make sure `~/.local/bin` is on your `PATH`.

To use it as a Codex skill, copy or link the repository to `~/.agents/skills/codex-smart-router`.

## Usage

```zsh
codex-smart "Review this pull request and identify likely regressions"
codex-smart --route "Rename one variable in a TypeScript file"   # show the choice only
codex-smart --route --json "Explain this stack trace"           # includes features and reasons
codex-smart --route --router luna "Fix the login button"     # force the Codex classifier
codex-smart --model gpt-6.1-sol --effort max "Hard task"       # explicit, no routing call
codex-smart --models                                            # print the routing table
codex-smart --doctor                                            # CLI discovery, no API call
```

An explicit `--model`/`--effort` pair that is off the frontier still runs, with a warning pointing to a cheaper pair.

## Important limitation

This launches the **Codex CLI**. It cannot change the model or reasoning-effort picker inside an already-open ChatGPT/Codex desktop conversation.

## Safety and cost notes

- Only the task text is used for routing. The routing call runs read-only and ephemeral, and is told not to inspect files or use tools.
- With Jev, routing uses no Codex quota; Jev bills per input token (about 600 tokens per route). Without it, routing uses the cheapest Codex row (GPT-6 Luna / low). Skip routing with `--model`.
- `TYPESAFE_API_KEY` is read from the environment and sent only in the `Authorization` header.
- Model availability, quotas and model names are controlled by your Codex plan and may change.

## Test

```zsh
zsh tests/smoke.zsh
```

## License

MIT. See [LICENSE](LICENSE).
