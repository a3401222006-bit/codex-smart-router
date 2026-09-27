# codex-smart-router

Choose a GPT-6 model and reasoning effort for a task, then launch the Codex CLI. Also available as a standalone skill for ChatGPT desktop / Codex on **macOS and Windows**.

The shared core uses Node.js with no third-party runtime dependencies. The shell and PowerShell entrypoints use the same implementation.

## Default routing

| Work | Model | Starting effort |
| --- | --- | --- |
| Explicit mechanical work | GPT-6 Luna | low |
| Focused work needing verification | GPT-6 Luna | medium / high |
| Everyday development and debugging | GPT-6 Sol | medium |
| Unclear bugs or multi-file changes | GPT-6 Sol | high |
| Difficult diagnosis and architecture | GPT-6 Astra | high |
| Exceptionally demanding work | GPT-6 Astra | xhigh |

The classifier uses **GPT-6 Luna / low** and returns schema-constrained JSON. These are routing heuristics, not guarantees of task success or exact billing. A malformed successful response visibly falls back to **GPT-6 Sol / medium**. A failed classifier call stops without launching the task or retrying automatically.

Use `--profile legacy` for the old GPT-5.6 Luna / Terra / Sol roles. No automatic downgrade to legacy models occurs. `--models` lists the supported catalog; it does not prove that your account can access every model. The portable effort subset is `low`, `medium`, `high`, `xhigh`, `max`; automatic routing never chooses `max`. The old `minimal` setting is replaced by `low`. Host-specific `ultra` and API-only `none` are intentionally excluded.

## Requirements

- Node.js **18 or newer** (a supported Node LTS release is recommended).
- A current authenticated Codex CLI for live routing / task launching. Codex **0.157.0+** includes GPT-6 Sol and Luna; account and workspace access still apply.
- No CLI is needed for the skill's inline recommendation or an explicit offline `--route --model` result.

Install the official CLI if needed, then sign in:

```text
npm install -g @openai/codex
codex login
```

CLI discovery uses `CODEX_BIN` first, then `PATH`, then known macOS ChatGPT/Codex app bundle locations. On Windows, standard npm `codex.cmd` shims are resolved to the official JavaScript entrypoint and run with Node directly. This avoids passing task text through `cmd.exe`. Nonstandard shims require `CODEX_BIN` pointing to `codex.exe` or the official `codex.js` file. `CODEX_BIN` is a path, not a command with arguments.

## Install on macOS or Windows

Run in Terminal (macOS) or PowerShell (Windows):

```text
git clone https://github.com/a3401222006-bit/codex-smart-router.git
cd codex-smart-router
node scripts/install.mjs
```

The installer copies the self-contained skill to `~/.agents/skills/codex-smart-router` and creates launchers in `~/.local/bin` (under your user profile on Windows). It does not change PATH, PowerShell execution policy, credentials, or the desktop model setting. Existing installations are preserved unless `--force` is provided; updates then create backups outside the skill-discovery directory.

### macOS

```sh
~/.local/bin/codex-smart --doctor
~/.local/bin/codex-smart "Review this project for likely regressions"
```

Add `~/.local/bin` to PATH if you want the short `codex-smart` command. Check `command -v codex-smart` for an older copy shadowing it.

### Windows PowerShell

```powershell
& "$HOME/.local/bin/codex-smart.ps1" --doctor
& "$HOME/.local/bin/codex-smart.ps1" "Review this project for likely regressions"
```

If local policy blocks `.ps1` files, use Node directly without changing that policy:

```powershell
node "$HOME/.agents/skills/codex-smart-router/scripts/router.mjs" --route --json "Review this project"
```

The same direct Node command works on macOS. Linux also uses the shared core and POSIX launcher.

## Usage

From a checkout, macOS/Linux can run `./bin/codex-smart`; Windows can run `./bin/codex-smart.ps1`. All options are also available through the skill's `scripts/router.mjs`.

```sh
# Paid classifier call only; does not execute the task
codex-smart --route --json "Investigate an intermittent multi-file regression"

# Explicit model: bypasses classifier usage
codex-smart --model gpt-6-astra --effort high "Review the architecture"

# Old family, only when explicitly selected
codex-smart --profile legacy --route "Explain this function"

# Diagnostics do not call a model or print credentials
codex-smart --doctor
codex-smart --models
```

`--stdin` reads task text from standard input; use it with `--route` for automation and multiline input. Interactive launching requires a terminal. Put `--` before a task starting with a dash. `--timeout` bounds the routing call (default 90 seconds, maximum 600).

## ChatGPT desktop / Codex skill

The installed skill is named **codex-smart-router**. In a new desktop chat, select it in the skill picker or ask:

```text
Use $codex-smart-router to choose an appropriate model and reasoning effort for this task.
```

In desktop mode, the agent can recommend a model inline without an extra classifier call. If you request a live routing check, it runs the helper with `--route --json` using your authenticated CLI. The helper does not change the model of an existing desktop chat. Select the recommendation in the model picker yourself when appropriate. The skill does not create new chats or delegate tasks merely to change models.

If the new skill is not discovered, start a fresh chat or restart the app. ChatGPT surfaces without local skills or command execution can still follow the guidance as text, but cannot run this local launcher. This repository does not install a web/mobile plugin or claim support for every ChatGPT account/surface.

## Safety, failure handling, and cost

- The classifier receives only the supplied task text and routing criteria, runs in a temporary working directory with read-only sandboxing, and is instructed not to use tools. This instruction is not a hard tool-disable guarantee; existing global Codex configuration can still affect the subprocess. Normal Codex policy enforcement remains active.
- No API key is needed beyond your Codex CLI authentication. Jev, when used separately, has separate TypeSafe credits.
- Classifier input is sent through stdin. Temporary schema/output files are removed after success or failure. The final interactive task is passed as an argument to Codex; do not put credentials in task text.
- Authentication, quota, access, timeout, and network failures stop the routing workflow. The launcher does not infer exhausted credits from a generic error. Raw classifier logs are withheld because they can contain task text or credentials; run `codex` directly to diagnose an account problem.
- The launcher does not alter approval settings for the actual interactive task, install software automatically, or retry a failed task with a stronger model.

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

These are usage guidelines for a TypeSafe-enabled coding agent. The launcher does not invoke Jev, implement Jev error handling, or automatically apply these guidelines to every launched task. Its routing pass uses GPT-6 Luna by default, and installing the skill does not route ordinary chat through Jev. Request Jev explicitly when you want to try these workflows. Jev usage has its own TypeSafe credits, separate from Codex usage.

See TypeSafe's [Jev with coding agents](https://docs.typesafe.ai/introduction/coding-agents) for the distinction between a coding model and a structured-judgment model.

## Validation

```text
npm test
```

GitHub Actions runs the same behavioral tests on Windows, macOS and Linux with Node 18 and 22. Tests use a mock CLI and do not spend credits. They cover routing validation, fallback and failure handling, timeout cleanup, Unicode and shell metacharacters, Windows npm shim resolution, and skill installation / launcher execution.

A real `--route` call separately verifies live authentication and the classifier model; it does not validate every target model or every routing decision. No representative routing-quality benchmark is claimed.

## Official references

- [GPT-6 migration guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [Codex models](https://learn.chatgpt.com/docs/models)
- [CLI release notes](https://learn.chatgpt.com/docs/changelog)
- [Build skills and skill locations](https://learn.chatgpt.com/docs/build-skills)
- [ChatGPT desktop on Windows](https://learn.chatgpt.com/docs/windows/windows-app)

## License

MIT. See [LICENSE](LICENSE).
