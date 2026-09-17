# Awesome AZD Evaluation Terms

Authority: this repository-owned rule module, as indexed by [compliance-rules.md](compliance-rules.md).

Apply the linked Awesome AZD rule modules only when public Awesome AZD publication intent is explicit:

- [Publication rules](awesome-azd-publication-rules.md)
- [Submission rules](awesome-azd-submission-rules.md)

All collection rules have `status: active`, `policy_kind: approved`, and `severity: collection-required`. Rules default to `version: 1` and carry an explicit version when revised.

- **Audited commit:** the target repository commit named in the report. Validation evidence is fresh only when it identifies that commit.
- **Submission authority:** the repository-owned catalog recognizes exactly two paths: a direct Awesome AZD pull request or the automated template-submission issue.
- **Required README headings:** the literal H2 headings `## Important Security Notice`, `## Features`, `## Getting Started`, `## Guidance`, and `## Resources`, which the collection validator asserts. `AZD-AWESOME-001` evaluates README content topics and `AZD-AWESOME-007` evaluates this heading structure; evaluate them independently.
- **Required repository topics:** `azd-templates` and `ai-azd-templates`, alongside the language, model, and technology topics that describe the template.
- **Security validation:** the [PSRule for Azure](https://azure.github.io/PSRule.Rules.Azure/features/#learn-by-example) analysis that the collection's validation automation runs by default.
- **Recorded checks:** a validation run establishes only the checks it records. A run that does not record the required-README-headings check does not establish `AZD-AWESOME-007`, and a failing run whose recorded checks map to no active rule in this catalog — for example a missing dev container or `azure-dev` workflow — does not establish a failure.
- When validation records for the audited commit disagree, a recorded failure takes precedence over a success. When repository data, linked evidence, an image, or a submission record cannot be read, use the rule's `unknown` outcome; do not infer its contents.
