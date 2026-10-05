# codex-smart-router

Cost-aware routing for the Codex CLI. A cheap routing call (GPT-6 Luna / low) picks the least costly model and reasoning effort likely to finish the task, then starts the interactive Codex CLI with that choice. It also ships as a Codex skill (`SKILL.md`) that recommends a model inside a chat.

## Routing table

Source: Artificial Analysis Intelligence Index v4.3.2 snapshot (2026-09-30). Score = capability index; cost = cost per index task, normalised so GPT-5.6 Luna / low = 1.

Only the cost-efficiency frontier is used: a model/effort pair is dropped when another pair scores at least as high for less. That removes every GPT-5.6 tier, every GPT-6 Sol tier and every GPT-6 Astra tier except max. For example, Astra / high scores 51 at cost 173, while GPT-6.1 Sol / xhigh scores 51 at cost 39.

| Task shape | Route | Score | Cost | Router |
| --- | --- | ---: | ---: | --- |
| Mechanical work, formatting, renaming | gpt-6-luna / low | 21 | 0.45 | auto |
| Light chat, simple rewriting | gpt-6-luna / medium | 29 | 2 | auto |
| Small focused work needing checks | gpt-6-luna / high | 32 | 3 | auto |
| Small work needing more care | gpt-6-luna / xhigh | 34 | 4 | auto |
| Small but tricky reasoning | gpt-6-luna / max | 37 | 7 | auto |
| Everyday code reading, small edits | gpt-6.1-sol / low | 42 | 13 | auto |
| Everyday coding and debugging | gpt-6.1-sol / medium | 48 | 21 | auto (fallback) |
| Unclear bug, multi-file change | gpt-6.1-sol / high | 50 | 32 | auto |
| Difficult diagnosis, architecture | gpt-6.1-sol / xhigh | 51 | 39 | auto |
| Exceptionally demanding work | gpt-6.1-sol / max | 52 | 72 | explicit only |
| Last resort | gpt-6-astra / max | 53 | 326 | explicit only |

The router never picks the two explicit-only rows. An invalid or off-table routing reply falls back to `gpt-6.1-sol / medium`. A failed routing call (auth, quota, network) stops without starting the task.

Scores are general benchmark results, not a guarantee for any specific task, and actual plan usage may not scale with the cost column. Update `ROUTES` in `scripts/router.mjs` and the table in `SKILL.md` together when new data is published; a test checks that they match.

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
codex-smart --route --json "Explain this stack trace"
codex-smart --model gpt-6.1-sol --effort max "Hard task"       # explicit, no routing call
codex-smart --models                                            # print the routing table
codex-smart --doctor                                            # CLI discovery, no API call
```

An explicit `--model`/`--effort` pair that is off the frontier still runs, with a warning pointing to a cheaper pair.

## Important limitation

This launches the **Codex CLI**. It cannot change the model or reasoning-effort picker inside an already-open ChatGPT/Codex desktop conversation.

## Safety and cost notes

- Only the task text is used for routing. The routing call runs read-only and ephemeral, and is told not to inspect files or use tools.
- The routing call itself uses some quota. It uses the cheapest row (GPT-6 Luna / low). Skip it with `--model`.
- Model availability, quotas and model names are controlled by your Codex plan and may change.

## Test

```zsh
zsh tests/smoke.zsh
```

## License

MIT. See [LICENSE](LICENSE).
