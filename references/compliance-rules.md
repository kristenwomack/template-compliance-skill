# Compliance Rule Catalog

This repository-owned index and its linked modules are the skill's only compliance authority. Enforce only entries with `status: active` and `policy_kind: approved`. Catalog maintainers own, review, and version these deterministic requirements in this repository.

## Active modules

- [Core azd rules](core-azd-rules.md) — apply to an `azd` template.
- [Awesome AZD rules](awesome-azd-rules.md) — apply only when public Awesome AZD publication intent is explicit.

Do not turn descriptive guidance, recommendations, or optional enhancements into failures. Only an active approved rule's explicit requirement and outcome criteria are enforceable.

## Normative language

Catalog modules mirror the requirement layers of the guidance they encode:

- **MUST** — enforceable; expressed here as an active approved rule.
- **SHOULD** — recommended default; never a compliance failure.
- **MAY** — optional enhancement; never a compliance failure.

Optional repository assets are outside this catalog and must not be reported as failures unless an active rule names them. These include dev container and GitHub Codespaces configuration, checked-in CI/CD pipeline definitions such as an `azure-dev` workflow, end-to-end test suites, and screenshots, demo videos, or architecture diagrams.

## Extensible rule schema

Each rule must define:

| Field | Required | Meaning |
|---|---:|---|
| `id` | yes | Stable unique identifier. |
| `title` | yes | Short requirement name. |
| `version` | yes | Rule revision. |
| `status` | yes | `active`, `inactive`, or `deprecated`. |
| `policy_kind` | yes | `approved`, `placeholder`, or `example`. |
| `authority` | yes | Owning policy source or `none` for examples. |
| `requirement` | yes | Exact normative requirement. |
| `rationale` | yes | Why the approved rule exists. |
| `applies_when` | yes | Explicit target conditions; include exclusions. |
| `evidence` | yes | Read-only locations/fields to inspect. |
| `pass_when` | yes | Deterministic sufficient condition for pass. |
| `fail_when` | yes | Deterministic sufficient condition for fail. |
| `unknown_when` | yes | Missing or ambiguous evidence conditions. |
| `severity` | yes | Catalog-defined impact label. |
| `remediation` | yes | Proposed corrective action; never auto-apply. |
| `references` | yes | Policy citations or an empty list. |
| `metadata` | no | Extensible owner, tags, dates, or notes map. |

Rules may add fields, but additions cannot weaken authority, evidence, uncertainty, or read-only constraints. Rule order does not imply priority.

## Interpretation

- Evaluate each rule-target pair independently.
- A missing readable artifact may be a deterministic failure only when the rule says the artifact must exist.
- Missing historical, execution, repository-setting, or external evidence is `UNABLE TO DETERMINE`, not `FAIL`, unless readable evidence directly contradicts the rule.
- Scenario fit requires the documentation, configuration, resource declarations, and tracked-file state defined by the applicable rule. If any named evidence is absent or unreadable, return `UNABLE TO DETERMINE`.
- External validation automation is evidence, not authority. A run establishes only the checks it records, and a failing run whose recorded checks map to no active rule does not establish a failure.
- Rule modules use short keys (`applies`, `inspect`, `pass`, `fail`, `unknown`) with the same meaning as the corresponding schema fields above.
