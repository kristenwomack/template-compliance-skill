# Build or adapt

1. Resolve the project root, goal, and permitted local edits. Inspect existing
   code/configuration read-only first with the bundled
   `node "<installed-skill>/scripts/inspect-project.mjs" --root "<project>"`.
   Read relevant source and manifests for design decisions; facts are not a
   service detector. Do not overwrite existing configuration or assume a fresh
   project because some setup files are absent.
2. Check `azd version` and `azd init --help`. Explain the supported choices and
   select with the user when the desired path is unclear:

   | Starting point | Init approach |
   | --- | --- |
   | Existing code | Interactive **Scan current directory**; let azd detect services. It can generate `azure.yaml`, `.azure`, and `.gitignore` without checked-in infrastructure. |
   | Template-derived | Confirm destination first: `azd init --template <selected-template>` creates a template-named directory; `azd init --template <selected-template> .` initializes the current/resolved root. Verify installed help; inspect downloaded code before executing it. |
   | Minimal | `azd init --minimal` when supported; deliberately incomplete scaffolding, not a deployment-ready app. |
   | Copilot-assisted | Init preview can hand off to a separate terminal agent session. Explain the handoff and obtain explicit approval; never recursively launch another agent/session. If unavailable, offer scan, template, or minimal. |
   | Existing/partial configuration | Preserve working choices. Inspect gaps, then propose targeted edits rather than rerunning init blindly. |

   Reference: [azd initialization workflows](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-init-workflow).
   Installed help controls available flags; interactive choices are not flags.
   For template init, confirm the absolute destination and command working
   directory with the user before acquisition. Run the `.` form from the resolved
   project root (or use supported `--cwd`); do not assume the shell is already
   there. Explain both forms and avoid unexpected nested/sibling directories.
   Version-specific behavior and read-only verification:
   [init sources](init-sources.md). Do not run init merely to discover its behavior.
3. Explain the intended file changes and any overwrite risks. Apply only
   requested local edits, after resolving design choices (service boundaries,
   hosting, infrastructure ownership). Do not add gallery requirements to an
   ordinary app. Existing infrastructure and generated-on-demand infrastructure
   are valid possibilities; absence alone is not failure.
4. Before running init or any validation/build command, inspect hooks,
   referenced scripts and package/build tools. Honor access restrictions and
   stop on unresolved execution risks. Template acquisition/network access
   requires the user's selected source and permission.
5. Reinspect changed files; report what was generated/adapted, limitations,
   and the next user decision. Do not deploy just to validate initialization.
   A requested cloud operation routes to [operate.md](operate.md), with its
   authorization gate; publication review routes to [publish.md](publish.md)
   only when requested. Neither is automatic.
