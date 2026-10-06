# Awesome AZD Evaluation Terms

Authority: this repository-owned rule module, as indexed by [compliance-rules.md](compliance-rules.md).

Apply the linked Awesome AZD rule modules only to the explicitly selected `public-awesome-azd` profile:

- [Publication rules](awesome-azd-publication-rules.md)
- [Submission rules](awesome-azd-submission-rules.md)

Use [policy-profiles.md](policy-profiles.md) to distinguish preparation from an
in-progress submission. Preparation excludes AZD-AWESOME-006. Never apply these
modules to `core-only`, `organization-catalog`, or unresolved destinations.

All collection rules have `status: active`, `policy_kind: approved`, and `severity: collection-required`. Rules default to `version: 1` and carry an explicit version when revised.

Use the pinned guidance and conflict decisions in [policy-sources.md](policy-sources.md), not unversioned validator defaults. Root README paths mean the resolved template root; repository-wide governance and GitHub metadata remain repository-scoped.

- **Audited commit:** the target repository commit named in the report. As a local evidence safeguard, validation evidence is fresh only when it identifies that commit and no relevant uncommitted changes invalidate the check.
- **Submission authority:** the repository-owned catalog recognizes exactly two paths: a direct Awesome AZD pull request or the automated template-submission issue.
- **Required README headings:** the literal H2 headings `## Important Security Notice`, `## Features`, `## Getting Started`, `## Guidance`, and `## Resources`, required by the pinned definition of done. Its example `README_H2_TAG` omits Important Security Notice; a validator run cannot establish that heading unless it records the check. `AZD-AWESOME-001` evaluates README content topics and `AZD-AWESOME-007` evaluates this heading structure; evaluate them independently.
- **Required repository topics:** `azd-templates` and `ai-azd-templates`, alongside the language, model, and technology topics that describe the template.
- **Security validation:** the [PSRule for Azure](https://azure.github.io/PSRule.Rules.Azure/features/#learn-by-example) analysis that the collection's validation automation runs by default.
- **Recorded checks:** a validation run establishes only the checks it records. A run that does not record the required-README-headings check does not establish `AZD-AWESOME-007`, and a failing run whose recorded checks map to no active rule in this catalog — for example a missing dev container or `azure-dev` workflow — does not establish a failure.
- When validation records for the audited commit disagree, a recorded failure takes precedence over a success. When repository data, linked evidence, an image, or a submission record cannot be read, use the rule's `unknown` outcome; do not infer its contents.
