# 🧭 azd

An agent skill for the Azure Developer CLI (`azd`): build or adapt projects,
operate and troubleshoot, check project setup, and prepare or review template
publication. This repository contains agent tooling, not a deployable template.

The skill uses scripts for local facts, installed azd commands for operations,
and agent judgment for semantics and design. It does not replace azd's service
detection or treat every application as a gallery template.

## Install

Copy the complete [`skills/azd`](skills/azd/) directory into the skills location
supported by your agent runtime. Keep the directory and frontmatter name `azd`,
including `scripts/`, `policy/`, and `references/`. No runtime-specific installer
is assumed.

The bundled inspectors need Node.js 22.12 or newer and no npm dependencies.
Operational workflows need an installed azd CLI. The skill checks its version
and command help before choosing options; preview capabilities may vary.

## Use

| Ask for | Workflow | Boundary |
| --- | --- | --- |
| “Help me add azd to this existing app.” | Build/adapt | Only requested local changes. |
| “Initialize from this template” or “Start minimal.” | Build/adapt | Inspect code before execution; preserve existing files. |
| “Help me use Copilot-assisted init.” | Build/adapt | A separate Copilot agent-session handoff under `azd init` requires explicit approval; no recursive handoff from a running agent. |
| “Diagnose this azd deploy error.” | Operate/troubleshoot | Read-only diagnosis first; cloud changes require authorization. |
| “Check this project's azd setup.” | Project check | Read-only facts and gaps, not template publication rules. |
| “Review this template for Awesome AZD preparation.” | Publication review | Read-only core plus selected destination policy; no implicit submission. |
| “Assess core template compliance only.” | Publication review | Explicit stricter template assessment, not an ordinary project check. |

The entry point is a lightweight router. It loads `build.md`, `operate.md`,
`check.md`, or `publish.md` only when that workflow is needed.

### Initialization is a choice, not a readiness verdict

Supported starting points include existing code (**Scan current directory**),
template-derived initialization (`--template`), minimal initialization
(`--minimal`), and the Copilot-assisted preview. Installed help determines
available options; interactive choices are not invented flags.

Confirm the absolute destination and command working directory before template
acquisition. Current azd uses `azd init --template <selected-template>` to create
a template-named directory; `azd init --template <selected-template> .` targets
the current directory, so run it from the resolved project root (or use supported
`--cwd`). Check installed `azd version` and `azd init --help` first because versions
may differ. See [pinned init verification](skills/azd/references/init-sources.md).

Existing-code initialization can generate `azure.yaml`, `.azure`, and
`.gitignore` without checked-in infrastructure. Partial and existing
configurations need targeted inspection, not an automatic reset.
See the [documented init workflows](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-init-workflow).

Copilot-assisted init creates a separate Copilot agent session through the running
`azd init` command; it need not open a separate visible terminal. That session may
inspect and modify project files using approved tools. Explain this capability
and obtain explicit approval before handoff. An already-running agent must not
invoke it recursively; offer scan, template, or minimal alternatives instead.
See [verified session implementation](skills/azd/references/init-sources.md#copilot-agent-session-handoff);
availability still depends on installed version/help.

**Initialized**, **deployed**, **publication-ready**, and **accepted** are
different states. Files alone prove neither a successful deployment nor
collection acceptance.

### Project diagnostics versus publication assessment

Project checks return **Project facts**, **Gaps and uncertainty**, and
**Next steps**. They do not impose public governance files, README headings,
gallery images/topics, submission records, checked-in infrastructure, or
teardown evidence. Missing setup is contextual information, not a failed
publication rule.

For an explicitly requested template publication assessment, the preserved
core/public catalog is intentionally stricter:

| Profile | Scope |
| --- | --- |
| `core-only` | Bundled core template requirements; no destination assessment. |
| `public-awesome-azd` | Core plus pinned public requirements. Preparation does not require an open submission; submission review adds the process check. |
| `organization-catalog` | Core plus existing organization requirements explicitly selected by the user; no imported public rules. |
| `unresolved` | Ask which publication destination is intended; if unresolved, assess core only with destination NOT ASSESSED. |

Visibility never selects a destination. Organization requirements remain
ordinary selected documents, with their own headings/IDs—not a required new
policy format. Missing or ambiguous policy leaves organization readiness
UNABLE TO DETERMINE; no applicable mandatory rules is not PASS.

Publication reports retain PASS / FAIL / UNABLE TO DETERMINE findings, evidence,
matching counts, separate core/destination readiness, revision and limitations,
and a no-modification statement. Optional guidance is not enforced.

### Script-driven facts

Run the trusted installed scripts against explicitly selected roots:

```text
node "<installed-skill>/scripts/inspect-project.mjs" --root "<project>"
node "<installed-skill>/scripts/check-publication.mjs" --root "<template>" --profile core-only
node "<installed-skill>/scripts/check-publication.mjs" --root "<template>" --repository-root "<repository>" --profile public-awesome-azd --stage preparation
```

The project inspector emits compact setup facts/gaps and root build-manifest
names. It does not parse YAML, infer services, resolve infrastructure paths, or
execute azd. The publication checker emits static findings and filtered
remaining criteria, safeguards, and citations—not an overall verdict.
Both are read-only, use Node.js built-ins, avoid external symlink traversal,
and neither execute target code nor access the network.

Before operational azd commands, the agent inspects hooks, referenced scripts,
package/build tools, and imported template code because azd can execute code.
Unresolved execution risks stop execution. Cloud changes require authorization
for action and environment; deploy, teardown, and submission are never implicit.
Requested file fixes route to build, not silent mutations during a review.

## Policy maintenance

[`skills/azd/policy/publication-catalog.json`](skills/azd/policy/publication-catalog.json)
is the canonical bundled publication policy. It is not an azd project
configuration format. The checker filters active approved rules by profile and
stage. Generated views support human review and manual fallback; detailed
provenance is [on demand](skills/azd/references/policy-sources.md).

Edit that JSON for bundled policy changes, run `npm run catalog:generate`, and
include the updated views. `npm run catalog:check` detects drift. Organization
documents are interpreted directly and never converted into this catalog.

## Repository layout

```text
skills/azd/
  SKILL.md                       # Router and shared boundaries
  references/build.md            # Requested local edits and init choices
  references/operate.md          # Authorized operations and troubleshooting
  references/check.md            # Read-only project diagnostics
  references/publish.md          # Read-only template publication assessment
  references/                    # Generated rule views, report contract, provenance
  policy/publication-catalog.json
  scripts/inspect-project.mjs
  scripts/check-publication.mjs
  scripts/file-facts.mjs
tools/generate-catalog.mjs
evals/eval.yaml                   # Vally behavioral journeys
evals/tasks/                      # Synchronized legacy task expectations
evals/fixtures/
evals/graders/                    # Publication report grader and static tests
evals/parity/                     # Legacy/Vally drift checks
```

## Develop and validate

```text
npm ci
npm run check
npm run eval:ci
npm run eval:full
```

`check` runs generated-view drift checks, Node tests, legacy/eval parity, and
strict Vally lint. Live behavioral runs require a configured Copilot executor
and model access; static checks do not establish model behavior.
The evaluation suite preserves read-only publication contracts and adds
project journeys for existing code, partial setup, template-derived projects,
and existing configuration. See [`evals/eval.yaml`](evals/eval.yaml).
