# 🧭 template-compliance

Welcome! `template-compliance` is a standalone analysis skill that helps you inspect Azure Developer CLI (`azd`) templates against a bundled, repository-owned rule catalog. Every inspection is read-only, so the skill reports what it finds without changing the template.

## 📦 Install

To get started, copy `skills/template-compliance` into the skills location supported by your agent runtime. Keep the installed directory name and frontmatter name as `template-compliance`. The skill does not bundle or assume a runtime-specific installer.

## 🔍 Use

Ask your agent to inspect named template files or directories for compliance. The skill:

- uses only active rules in `references/compliance-rules.md`;
- reports `PASS`, `FAIL`, or `UNABLE TO DETERMINE`;
- cites evidence or describes the evidence gap;
- proposes, but never applies, remediation; and
- never edits target templates.

Example request:

> Check this repository for core azd template compliance and return the compliance report.

Ask explicitly for **Awesome AZD publication readiness** when collection rules should also apply. The skill does not assume publication intent. If scope cannot be resolved, it limits the inspection to core rules and reports the limitation.

The bundled, repository-owned catalog is the skill's only compliance authority. Active approved rules define enforceable requirements; descriptive guidance, optional enhancements, and optional repository assets such as dev containers or CI/CD pipeline definitions are not compliance failures. External validation automation is evidence, not authority: a run establishes only the checks it records. Review and version catalog changes in this repository so the policy stays clear and intentional.

## 🛠️ Customize policy

The catalog is designed to grow with your needs. Edit the modules indexed by `skills/template-compliance/references/compliance-rules.md` and add organization-approved rules using its schema. Give each rule a stable ID, explicit applicability, evidence instructions, deterministic pass/fail criteria, and remediation. Placeholder or example rules are never enforced.

Keep policy interpretation out of `skills/template-compliance/SKILL.md`: the catalog is authoritative.

## 🧪 Evaluate

The behavioral suite runs on [Vally](https://www.npmjs.com/package/@microsoft/vally-cli), Microsoft's evaluation platform for AI agents.

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
| `npm test` | Unit tests for the custom grader and its Markdown report parser (Node's built-in test runner). | No |
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

- **`ci-gate`** — the `p0` and `p1` stimuli: routing, the report contract, remediation, uncertainty handling, non-trigger behavior, publication-scope ambiguity, and optional-asset limits.
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

Because `--grader-plugin` is resolved relative to the eval-spec directory for `vally lint` and relative to the project root for a suite run, the two paths in `package.json` differ on purpose:

- `npm run lint` → `./graders/template-compliance-report.js`
- `npm run eval:*` → `./evals/graders/template-compliance-report.js`

Both point at the same file.

### Legacy fixtures

`evals/tasks/*.yaml` holds the nine pre-Vally fixtures. They are **still the human-readable source of truth** for what each scenario expects, and they are deliberately retained until the Vally suite has been observed to reproduce their behavior on live runs. `npm run parity` fails the build if the two descriptions drift: it checks name coverage in both directions, fixture staging, overall results, `{rule ID: status}` maps, exhaustiveness, trigger intent, and rubric coverage. Delete the legacy directory only after live behavioral parity, not before.

## 🗂️ Layout

Here is where everything lives:

```text
template-compliance-skill/
├── skills/
│   └── template-compliance/
│       ├── SKILL.md                     # Routing, constraints, and analysis workflow
│       └── references/
│           ├── compliance-rules.md      # Authoritative rule schema and catalog
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

The [azd-template-artifacts repository](https://github.com/Azure-Samples/azd-template-artifacts) informed this catalog and provides example templates and supporting artifacts. It is a helpful reference, but it is **not** a compliance authority: nothing in it is enforceable here. This skill evaluates only the rules bundled in its repository-owned catalog.
