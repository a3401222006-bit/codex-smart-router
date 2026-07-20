# codex-smart-router

A small `zsh` launcher that asks a low-cost Codex model to select the right Codex model and reasoning effort for a task, then starts the interactive Codex CLI with that choice.

It is intended for people who want consistent cost-aware routing across `Luna`, `Terra`, and `Sol` without choosing the model manually every time.

## Routing policy

| Task shape | Route |
| --- | --- |
| Explicit, mechanical, low-risk work | Luna / minimal or low |
| Everyday coding, reading, tests, debugging | Terra / medium |
| Multi-file work or unclear bugs | Terra / high |
| Architecture, difficult diagnosis, cross-module refactors | Sol / high |
| Security-sensitive, production-critical, or exceptionally difficult work | Sol / xhigh |

The routing pass uses Luna at low effort and runs in read-only, ephemeral mode. The actual task is then launched with the selected model and effort. Invalid router output safely falls back to `Terra / medium`.

## Requirements

- macOS or Linux with `zsh`
- Codex CLI available as `codex` on `PATH`, or `CODEX_BIN` set to its executable path
- An authenticated Codex CLI session

On macOS, the launcher also detects the Codex CLI bundled with the ChatGPT desktop app at `/Applications/ChatGPT.app/Contents/Resources/codex`.

## Install

```zsh
git clone https://github.com/a3401222006-bit/codex-smart-router.git
cd codex-smart-router
chmod +x bin/codex-smart
mkdir -p ~/.local/bin
ln -sf "$PWD/bin/codex-smart" ~/.local/bin/codex-smart
```

Ensure `~/.local/bin` is on your `PATH`, then run:

```zsh
codex-smart "Review this pull request and identify likely regressions"
```

To inspect the choice without running the task:

```zsh
codex-smart --route "Rename one variable in a TypeScript file"
```

To use a non-default CLI location:

```zsh
CODEX_BIN=/path/to/codex codex-smart "Explain this error message"
```

## Important limitation

This launches the **Codex CLI**. It cannot automatically change the model or reasoning-effort picker inside an already-open ChatGPT/Codex desktop conversation. Start work through `codex-smart` when you want strict routing.

## Safety and cost notes

- Only the task text is used for routing; the router is instructed not to inspect local files or use tools.
- The routing call itself consumes some usage. It is deliberately routed to Luna at low effort.
- Model availability, quotas, and model names are controlled by your Codex plan and may change.

## Test

```zsh
zsh tests/smoke.zsh
```

## License

MIT. See [LICENSE](LICENSE).
