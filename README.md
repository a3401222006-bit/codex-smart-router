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

## Optional Jev judgments with the TypeSafe skill

Jev can help with repeated, narrowly defined decisions inside a task. Codex handles the overall task, defines the criteria, and interprets the results; Jev returns typed judgments:

| Primitive | Useful examples | Result |
| --- | --- | --- |
| Choice | Categorize to-dos or route a request to a team | One candidate, with probabilities and confidence |
| Noul | Filter relevant passages or check whether evidence supports a claim | Probability that a yes/no condition holds |
| Score | Compare content ideas for relevance or feasibility | A rating against ordered, descriptive levels |

A practical first trial is a batch of to-dos or content ideas with explicit criteria. Ask Codex to use Jev and show its judgments so you can inspect whether the results are useful. Scores and probabilities are not guarantees of correctness; validate them on your own examples.

### Setup and use

Install the official TypeSafe skill once (skip this if already installed):

```zsh
npx skills add typesafe-ai/skills --skill typesafe-ai
```

Select Codex when prompted. The skill should read the [live documentation index](https://docs.typesafe.ai/llms.txt), the current [HTTP API reference](https://docs.typesafe.ai/api), and the relevant primitive guidance before making calls. Use the official API or an official SDK; no third-party Jev gateway or MCP is required.

Make `TYPESAFE_API_KEY` available to the process making the request. Keep the credential out of prompts, source files, command-line arguments, shell history, and logs. On macOS, one option is to store it in the login Keychain and load it at shell startup. After securely creating a generic-password item with service `ai.typesafe.api-key` and your login username as the account, this snippet can be added to `~/.zshenv`:

```zsh
if [[ -z "${TYPESAFE_API_KEY:-}" ]]; then
  typesafe_keychain_value="$(/usr/bin/security find-generic-password -a "$USER" -s ai.typesafe.api-key -w 2>/dev/null)"
  if [[ -n "$typesafe_keychain_value" ]]; then
    export TYPESAFE_API_KEY="$typesafe_keychain_value"
  fi
  unset typesafe_keychain_value
fi
```

This snippet contains no credential and does not create the Keychain item. It exposes the variable to new zsh processes and their children; it does not update an already-running desktop app's environment. A desktop Codex session can explicitly start a fresh zsh process for the API call. Keychain access and network access remain subject to the host's permissions and sandbox; obtain the necessary authorization when access is blocked. Verify availability without printing the variable's value.

Example request to the coding agent:

```text
Use the TypeSafe skill and Jev to classify these to-dos into study, work,
and personal categories. Show the typed judgments and flag ambiguous results.
If the API reports insufficient credits, tell me and identify unfinished work.
```

### Credit exhaustion and failures

For workflows using Jev, the agent should report an explicit insufficient-credit or exhausted-quota response promptly, identify affected or unfinished work, and stop retrying that condition. If it continues using Codex alone, it should say so and keep those results distinguishable from Jev results. Authentication errors, temporary rate limits, and network failures should be reported according to their actual cause; a generic failure or HTTP 429 alone is not proof that credits are exhausted. Never include the credential in an error report.

There is no background balance monitor or advance low-credit warning in this repository. Credit problems can only be reported when a call reveals them unless a separate monitor is implemented.

### Current integration boundary

These are usage guidelines for a TypeSafe-enabled coding agent. The launcher does not invoke Jev, implement Jev error handling, or automatically apply these guidelines to every launched task. Its routing pass still uses Luna, and installing the skill does not route ordinary chat through Jev. Request Jev explicitly when you want to try these workflows. Jev usage has its own TypeSafe credits, separate from Codex usage.

See TypeSafe's [Jev with coding agents](https://docs.typesafe.ai/introduction/coding-agents) for the distinction between a coding model and a structured-judgment model.

## Test

```zsh
zsh tests/smoke.zsh
```

## License

MIT. See [LICENSE](LICENSE).
