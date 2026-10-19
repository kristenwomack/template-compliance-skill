# Deterministic publication checks

For explicit template assessments only. Ordinary project diagnostics use
`inspect-project.mjs` and [check.md](check.md), without publication rules.

Run the script from the installed skill directory, not from the inspected target.
It uses only Node.js built-ins (Node.js 22.12 or newer), so copying the complete
skill directory is sufficient; no npm installation is needed to audit a target.
Use an absolute script path and explicitly selected roots. Quote paths containing
spaces. For example, from the installed skill directory:

```text
node scripts/check-publication.mjs --root "<template-root>" --profile core-only
node scripts/check-publication.mjs --root "<template-root>" --repository-root "<repository-root>" --profile public-awesome-azd --stage preparation
```

Use the host's path separators. The supported profiles are `core-only`,
`public-awesome-azd`, `organization-catalog`, and `unresolved`. Public defaults to
preparation; submission must be explicitly selected. No visibility, policy files,
Git metadata, or target content can select or change the profile.

| Rule | Automated inspection |
| --- | --- |
| AZD-CORE-001 | Readable `azure.yaml` file at the selected template root. |
| AZD-AWESOME-002 | Repository-root governance files and a legacy `.github/ISSUE_TEMPLATE.md` or Markdown/YAML file in `.github/ISSUE_TEMPLATE/`. `config.yml` alone is not an issue template. |
| AZD-AWESOME-007 | Literal required H2 headings in template-root `README.md`, excluding fenced code, indented code, and HTML comments. Raw HTML blocks require manual inspection. |

Public checks never run for other profiles. Repository root must be supplied for
governance checks, even when it equals the template root. An omitted root is an
evidence gap, not permission to inspect the host repository. The script does not
follow links outside the relevant selected root. Broken links, unavailable
listings, and unsupported evidence yield UNABLE TO DETERMINE. Proven absence or
a directory where a file is required yields FAIL.

## Output and completion

Standard output is JSON with `format_version`, `catalog`, selected roots,
profile/stage, `findings`, `remaining_rules`, `safeguards`, and `limitations`.
Payload format version 2 replaces the version 1 ID-only list. Each remaining rule
includes requirement, applicability, evidence criteria, pass/fail/unknown outcomes,
remediation, and source citations. Criteria come from the installed `policy/publication-catalog.json`,
not target files. Only active, approved rules for the selected profile/stage appear.
Each finding
contains an ID, layer, status, evidence paths (and heading lines when available),
and rationale, policy basis, and remediation or reconciliation criteria when needed.
Target file contents are not echoed. Invalid arguments or an
internal failure produce a diagnostic on standard error and exit code 1.
Completed inspection exits 0 even when findings fail or are indeterminate:
exit code is not a compliance verdict.

The script never emits an overall verdict. Complete every remaining applicable
rule with its included evidence criteria, including schema conformance, semantic
README content, infrastructure fit, commit/tracked-file state, execution records,
metadata, submission data, and security validation. Organization requirements
always need inspection of the explicitly selected document. Do not infer a
deployment, schema, security, or collection PASS from static files.

Before producing the Markdown report, reconcile static findings with supplied
records according to each rule (especially fresh heading validation records).
Include remediation for failures, evidence needed for indeterminate findings,
policy basis, and revision/working-tree state. Never duplicate script findings
as new manual findings. If the script cannot run, or the input consists only of
synthetic evidence summaries, use the selected generated catalog views directly and state the
script limitation. Do not run the checker against denied paths to bypass access
restrictions.
