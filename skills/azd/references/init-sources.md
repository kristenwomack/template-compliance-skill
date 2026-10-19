# Initialization source verification

Verified read-only on 2026-10-15. No initialization, downloads of templates,
project changes, or cloud operations were performed to verify these semantics.

## Template destination

Upstream `Azure/azure-dev` HEAD was pinned to
[`c681d5a9e52961914e12e98255680363c52e2a7f`](https://github.com/Azure/azure-dev/tree/c681d5a9e52961914e12e98255680363c52e2a7f).
Read [init.go](https://github.com/Azure/azure-dev/blob/c681d5a9e52961914e12e98255680363c52e2a7f/cli/azd/cmd/init.go)
and [init_test.go](https://github.com/Azure/azure-dev/blob/c681d5a9e52961914e12e98255680363c52e2a7f/cli/azd/cmd/init_test.go)
through GitHub's contents API. The command accepts one positional directory:
`resolveTargetDirectory` selects that directory when supplied and otherwise
derives a directory name from the template. A local template source that would
equal the destination has a self-targeting fallback; do not assume all template
sources necessarily create a new folder.

The installed CLI reported **azd 1.35.0**, commit
`170ebb858071da353cc9bf8657a377bff268ba36` (stable). Its `azd init --help`
explicitly documents both forms:

| Form | Destination |
| --- | --- |
| `azd init --template <selected-template>` | New template-named directory beneath the command working directory. |
| `azd init --template <selected-template> .` | The command's current directory. |

Help was inspected, not init executed. This is a versioned observation, not a
promise about every release. Before proposing or running initialization, check
the installed version/help, resolve and confirm the absolute destination, and
confirm the working directory. `.` does not mean an arbitrary selected project
unless the command actually runs there (or uses supported `--cwd`).

## Copilot agent-session handoff

At the same pinned revision,
[init.go](https://github.com/Azure/azure-dev/blob/c681d5a9e52961914e12e98255680363c52e2a7f/cli/azd/cmd/init.go)
`initAppWithAgent` requests workflow consent, creates an interactive Copilot agent,
initializes it, and sends the setup prompt. It can resume recorded session state.
[copilot_agent.go](https://github.com/Azure/azure-dev/blob/c681d5a9e52961914e12e98255680363c52e2a7f/cli/azd/internal/agent/copilot_agent.go)
uses SDK session creation/resumption and a tool-permission callback.
[session_config.go](https://github.com/Azure/azure-dev/blob/c681d5a9e52961914e12e98255680363c52e2a7f/cli/azd/internal/agent/copilot/session_config.go)
sets the session working directory for tool operations.

This is a separate Copilot agent session under the running `azd init`, not a
promise of another visible terminal. It may inspect and modify project files
using approved tools; it is not merely a read-only plan. Explain permissions and
obtain explicit user approval for the handoff and intended edits. The skill's
no-recursion boundary is local policy: an already-running agent must not launch
this handoff recursively. Offer non-agent initialization alternatives instead.
No Copilot session was launched for this verification. Installed 1.35.0 help
does not expose a dedicated Copilot init flag; do not invent one or assume
preview availability from the upstream implementation.
