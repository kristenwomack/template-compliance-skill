# 🧭 template-compliance

Welcome! `template-compliance` is a standalone analysis skill for testing and guiding Azure Developer CLI (`azd`) template compliance against a bundled, repository-owned rule catalog. This project is tooling for template authors and coding agents, not a deployable template. Every inspection is read-only, so the skill reports what it finds and recommends next actions without changing the template.

## 📦 Install

To get started, copy `skills/template-compliance` into the skills location supported by your agent runtime. Keep the installed directory name and frontmatter name as `template-compliance`. The skill does not bundle or assume a runtime-specific installer.

## 🔍 Use

Ask your agent to inspect named template files or directories for compliance. The skill:

- checks the selected bundled catalog rules or existing organization requirements;
- reports `PASS`, `FAIL`, or `UNABLE TO DETERMINE`;
- cites evidence or describes the evidence gap;
- proposes, but never applies, remediation; and
- never edits target templates.

Example request:

> Check this repository for core azd template compliance and return the compliance report.

### Choose the destination

| Profile | When to use it | Checks |
| --- | --- | --- |
| `core-only` | Building or inspecting any azd project, public or private | Shared azd requirements only; no collection assessment. |
| `public-awesome-azd` | Preparing a public contribution or inspecting an in-progress submission | Core plus the pinned public requirements. Preparation does not require an open submission; submission adds the process check. |
| `organization-catalog` | Preparing a template for an internal collection | Core plus existing organization requirements selected by the user; no public requirements. |

Examples:

> Check this private project for core azd readiness only.

> Check this template for public Awesome AZD readiness. We are preparing materials; no submission is underway.

> Audit this in-progress Awesome AZD submission, including its submission process.

> Check this template for our internal catalog using our existing requirements in `docs/internal-template-requirements.md`.

Repository visibility does not select a profile. If the destination is unresolved,
the skill asks; if it remains unresolved, it assesses core only and reports
destination readiness as **NOT ASSESSED**. Reports show core and destination
readiness separately, with source revisions when available.

Private projects do not inherit public license conventions, README headings,
gallery images, topics, or submission requirements. For an organization-catalog
assessment, missing, inaccessible, or ambiguous requirements leave
organization readiness **UNABLE TO DETERMINE**, even if core checks pass.
An organization document with no applicable mandatory requirements has **NO ACTIVE APPLICABLE RULES**, not PASS.
Policy-resolution gaps are limitations, not fabricated rule findings.

The bundled, repository-owned catalog defines core and public checks. Organization checks use existing requirements explicitly selected by the user; descriptive guidance and optional enhancements are not compliance failures. Assets such as dev containers or CI/CD pipeline definitions are required only if a selected requirement explicitly requires them. External validation automation is evidence, not authority: a run establishes only the checks it records. Review and version catalog changes in this repository so the policy stays clear and intentional.

### Deterministic checks, orchestrated by the agent

The skill runs a bundled, dependency-free Node.js script for root `azure.yaml`
presence, public governance files, and required public README H2 headings.
The script returns evidence-backed JSON findings and the remaining rule IDs;
the agent handles semantic checks, external records, selected organization
requirements, and the final report. A partial static pass is never overall
compliance. The script does not execute target code, deploy resources, access the
network, or modify files.

Copy the complete skill directory, including `scripts/`, when installing.
Auditing needs Node.js 22.12 or newer but no npm dependencies. When the runtime or
local files are unavailable, the agent reports that limitation and uses the
catalog's evidence criteria directly. See
[static checks](skills/template-compliance/references/static-checks.md)
for invocation, scope, output, and manual-completion boundaries.

## 🛠️ Customize policy

For an internal catalog, point the skill at your team's existing requirements:
Markdown documentation, an internal handbook, or another readable source.
There is no required YAML format, approval-record structure, metadata schema,
or organization rule namespace. The skill cites your existing section headings
or identifiers and asks when authority, scope, or wording is unclear.
See [organization requirements](skills/template-compliance/references/organization-policy.md).

Organization requirements supplement core checks and cannot override them or
weaken read-only boundaries. Finding a policy file does not authorize its use;
select it explicitly. Public-gallery requirements remain separate.

Keep core/public policy interpretation in the references, rather than duplicating
it in `skills/template-compliance/SKILL.md`. The catalog structure and profile
names are local conventions of this tool, not azd or Copilot standards.

### Policy provenance and guidance

Catalog `template-compliance@4` records its upstream baseline, per-rule source links,
local evidence safeguards, and source/validator differences in
[policy-sources.md](skills/template-compliance/references/policy-sources.md).
The baseline is `Azure-Samples/azd-template-artifacts` at commit
`22de60335bd77269a2e952cd0e3e8fab56ed4aa1`. New upstream guidance is reviewed,
not silently imported.

The skill resolves a template's documented working directory, supports azd's
default infrastructure path, and distinguishes upstream requirements from local
evidence criteria. Source-backed SHOULD and MAY guidance is reported separately
as Recommended or Optional and never changes a compliance result. A catalog PASS
is not official certification or a guarantee of gallery acceptance.

## 🧪 Evaluate

The behavioral suite runs on [Vally](https://www.npmjs.com/package/@microsoft/vally-cli), Microsoft's evaluation platform for AI agents.

### Fixture boundaries

Private/internal profile cases stage small azd project files (`azure.yaml`,
`README.md`, and Bicep) and ordinary Markdown requirements where selected. Scope,
simulated tracked-file state, and access limitations are supplied in the test
prompt, not in a special project configuration file.

Other cases use clearly synthetic evidence summaries to exercise results for
external metadata, historical execution, or denied access without deploying
resources. These evaluation inputs are not azd configuration formats or customer
requirements. Static checks establish parser/configuration consistency, not live
agent effectiveness, successful deployment, or catalog acceptance.

### Before you start

- **Node.js 22.12 or newer.** Vally 0.15 declares that engine floor; the workflows use Node 24.
- **Nothing to install globally.** The Vally CLI, the Vally core library, and the YAML parser used by the parity checker are pinned devDependencies.

```bash
npm install     # first time, or after pulling a lockfile change
npm ci          # reproducible install from package-lock.json (what CI runs)
```

### Commands

| Command | What it does | Needs a token? |
| --- | --- | --- |
| `npm test` | Unit tests for the static checker, custom grader, and Markdown report parser (Node's built-in test runner). | No |
| `npm run parity` | Compares the legacy `evals/tasks/*.yaml` fixtures against the Vally suite. | No |
| `npm run lint` | Strict Vally lint of the skill and `evals/eval.yaml`, with the local grader plugin loaded. | No |
| `npm run check` | All three of the above, in order. Run this before you open a pull request. | No |
| `npm run eval:ci` | Behavioral `ci-gate` suite — the p0 and p1 stimuli. Fails the process on any regression. | **Yes** |
| `npm run eval:full` | Behavioral `full` suite — every stimulus. | **Yes** |

### The Copilot token

The behavioral suites drive a real agent, so they need a GitHub token with the **Copilot Requests** permission, exposed to Vally as `COPILOT_GITHUB_TOKEN`:

```bash
export COPILOT_GITHUB_TOKEN="<token with Copilot Requests>"
npm run eval:ci
```

In GitHub Actions the same value comes from a repository secret named `COPILOT_CLI_TOKEN`. Until that secret exists, `.github/workflows/vally-eval.yml` stays **manual only** (`workflow_dispatch`), asks you to type `run` to confirm, and fails fast with a clear message if the secret is missing. `.github/workflows/static-checks.yml` runs the credential-free checks on every push and pull request.

### How the suite is scored

`.vally.yaml` defines two suites over `evals/eval.yaml`:

- **`ci-gate`** — the `p0` and `p1` stimuli: routing, report contracts, uncertainty, policy interpretation, private/public isolation, organization-policy selection and gaps, and public preparation.
- **`full`** — everything in `ci-gate` plus the `p2` stimuli that exercise positive, negative, and ambiguous behavior for all fourteen active catalog rules.

Every stimulus is graded by a deliberate mix, weighted so that the deterministic checks dominate and the judge only handles what a judge is actually good at:

| Grader | Weight | Responsibility |
| --- | --- | --- |
| `template-compliance-report` | 0.45 | Exact overall result, exact `{rule ID: status}` map, report hygiene. |
| `prompt` | 0.25 | Qualitative rubric only — evidence quality, remediation specificity, scope handling. |
| `skill-invocation` | 0.15 | The skill did (or did not) route. |
| `diff-empty` | 0.15 | The read-only promise held. |

The threshold is `1.0`, so a stimulus passes only when every grader that ran passes.

### The custom grader

`evals/graders/template-compliance-report.js` is a local Vally grader plugin. It registers through Vally's documented contract — a module exporting `registerGraders(registry)`, loaded with `--grader-plugin`. It is fully offline and deterministic: it parses the agent's Markdown report and asserts

- the exact overall result (`PASS`, `FAIL`, `UNABLE TO DETERMINE`, `NO ACTIVE APPLICABLE RULES`);
- selected destination profile, public stage, and separate readiness layers when configured; an organization-policy gap blocks overall PASS without adding a fake finding;
- the exact `{rule ID: status}` map, catching **missing** and **unexpected** findings;
- **duplicate** findings and conflicting restatements of the same rule;
- **malformed** entries — a finding with no rule ID, an ambiguous rule ID, a missing status, or a status that is not one of the three contract values;
- summary counts that agree with the detailed findings; and
- the required no-modification integrity statement.

It understands both report shapes the contract allows — one subsection per rule and one table row per rule — and a few harmless presentation variations (emphasis, backticks, a leading glyph, a trailing parenthetical). It does not tolerate a *different* word: `PASSED` and `N/A` are reported as malformed, on purpose.

Three config shapes cover the suite:

```yaml
# Exhaustive: the report must contain exactly these rules, with these statuses.
- type: template-compliance-report
  config:
    overall_result: PASS
    findings:
      AZD-CORE-001: PASS

# Partial: these rules are pinned, the rest follow their own evidence.
- type: template-compliance-report
  config:
    findings:
      AZD-AWESOME-002: PASS
    exhaustive: false

# Non-trigger: no compliance verdict or finding may appear at all.
- type: template-compliance-report
  config:
    expect_report: false
```

`expect_report: optional` is the fourth shape, used where the agent may legitimately ask a scoping question instead of reporting; it enforces only the constraints on a report that is actually produced.

Profile scenarios also set `destination_profile`, optional `public_stage`, and
`readiness: {core: PASS, destination: UNABLE TO DETERMINE}` (or the appropriate
verdicts). For organization fixtures, the evaluation config's `rule_id_pattern`
matches the selected document's existing identifiers or headings; it does not
impose an organization naming convention. The grader validates
layer consistency and profile isolation. Existing pre-profile report fixtures
remain supported by the grader; current skill reports must include layer labels.

Because `--grader-plugin` is resolved relative to the eval-spec directory for `vally lint` and relative to the project root for a suite run, the two paths in `package.json` differ on purpose:

- `npm run lint` → `./graders/template-compliance-report.js`
- `npm run eval:*` → `./evals/graders/template-compliance-report.js`

Both point at the same file.

### Legacy fixtures

`evals/tasks/*.yaml` holds the nine pre-Vally fixtures plus policy-interpretation and profile regressions. They are **still the human-readable source of truth** for what each scenario expects, and they are deliberately retained until the Vally suite has been observed to reproduce their behavior on live runs. `npm run parity` fails the build if the two descriptions drift: it checks name coverage in both directions, fixture staging, overall results, `{rule ID: status}` maps, exhaustiveness, trigger intent, and rubric coverage. Delete the legacy directory only after live behavioral parity, not before.

## 🗂️ Layout

Here is where everything lives:

```text
template-compliance-skill/
├── skills/
│   └── template-compliance/
│       ├── SKILL.md                     # Routing, constraints, and analysis workflow
│       ├── scripts/
│       │   ├── check-template.mjs       # Dependency-free read-only static checks
│       │   └── check-template.test.mjs  # Scope, filesystem, headings, and CLI tests
│       └── references/
│           ├── static-checks.md         # Script invocation and completion boundaries
│           ├── compliance-rules.md      # Authoritative rule schema and catalog
│           ├── policy-sources.md        # Pinned sources, interpretations, and guidance
│           ├── policy-profiles.md       # Core, public stages, and organization selection
│           ├── organization-policy.md   # Using existing internal requirements
│           ├── core-azd-rules.md        # Core azd requirements
│           ├── awesome-azd-rules.md     # Shared collection evaluation terms
│           ├── awesome-azd-publication-rules.md
│           ├── awesome-azd-submission-rules.md
│           └── report-format.md         # Required report contract
├── evals/
│   ├── eval.yaml                        # Vally stimuli, graders, and scoring
│   ├── fixtures/                        # Agent-visible evidence and template files
│   ├── graders/
│   │   ├── template-compliance-report.js  # Custom Vally grader plugin
│   │   ├── report-parser.js               # Deterministic Markdown report parser
│   │   └── tests/                         # node --test suites for both
│   ├── parity/
│   │   ├── legacy-parity.js             # Legacy-vs-Vally comparison
│   │   └── check-legacy-parity.js       # `npm run parity` entry point
│   └── tasks/                           # Legacy parity fixtures (retained)
├── .github/workflows/
│   ├── static-checks.yml                # Tests, parity, and lint on every push/PR
│   └── vally-eval.yml                   # Manual-only behavioral suite
├── .vally.yaml                          # Vally project configuration and suites
└── package.json                         # Pinned Vally CLI and scripts
```

## 🔗 Related resources

The [azd-template-artifacts repository](https://github.com/Azure-Samples/azd-template-artifacts) provides guidance and copyable assets for template authors. Its pinned requirements inform this catalog; the skill enforces only requirements explicitly adopted in the bundled catalog, with source provenance and local interpretation recorded alongside them.
