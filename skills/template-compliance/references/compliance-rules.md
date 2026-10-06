# Compliance Rule Catalog

This repository-owned index defines the bundled core and public checks. Enforce only bundled entries with `status: active` and `policy_kind: approved`. For internal catalogs, inspect existing requirements explicitly selected by the user; do not require organizations to adopt this catalog's schema.

Catalog identity: `template-compliance@4`. See [policy sources and interpretation](policy-sources.md) for the pinned upstream revision, source-to-rule mapping, local evidence safeguards, and conflict decisions. Upstream requirements inform this catalog; catalog approval is not official azd certification or collection acceptance.

## Active modules

- [Policy profiles](policy-profiles.md) — core, public preparation/submission, and organization selection.
- [Organization requirements](organization-policy.md) — inspecting selected existing documents without a new format.
- [Core azd rules](core-azd-rules.md) — apply to an `azd` template.
- [Awesome AZD evaluation terms](awesome-azd-rules.md) — shared definitions for collection rules.
- [Awesome AZD publication rules](awesome-azd-publication-rules.md) — repository publication requirements.
- [Awesome AZD submission rules](awesome-azd-submission-rules.md) — gallery, submission, heading, and security requirements.
- [Policy sources and interpretation](policy-sources.md) — provenance and non-enforcing recommendations.

Do not turn descriptive guidance, recommendations, or optional enhancements into failures. Only an active approved rule's explicit requirement and outcome criteria are enforceable.

## Normative language

Catalog modules mirror the requirement layers of the guidance they encode:

- **MUST** — enforceable; expressed here as an active approved rule.
- **SHOULD** — recommended default; never a compliance failure.
- **MAY** — optional enhancement; never a compliance failure.

Optional repository assets must not be reported as failures unless a selected active approved rule names them. These include dev container and GitHub Codespaces configuration, checked-in CI/CD pipeline definitions such as an `azure-dev` workflow, end-to-end test suites, and screenshots, demo videos, or architecture diagrams.

## Extensible rule schema

Each bundled rule must define (this is a project-local catalog structure, not an azd or organization-policy standard):

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
| `source_revision` | yes | Pinned upstream revision, organization source release, or an explicit live platform-reference designation. |
| `requirement_kind` | yes | `upstream-guidance` or `platform-constraint`; not a validator default. |
| `local_evidence_policy` | yes | Locally chosen evidence safeguards, explicitly distinguished from upstream requirements. |
| `metadata` | no | Extensible owner, tags, dates, or notes map. |

Rules may add fields, but additions cannot weaken authority, evidence, uncertainty, or read-only constraints. Rule order does not imply priority.

## Interpretation

- Evaluate each rule-target pair independently.
- Unknown applicability of an active approved rule is an UNABLE TO DETERMINE finding, not silent exclusion. Exclude a conditional rule only when readable evidence establishes non-applicability.
- Scope bundled `AZD-CORE-*` to all profiles and bundled `AZD-AWESOME-*` only to public readiness. Organization requirements keep their existing source IDs or section headings and cannot override bundled rules. Resolve profile and public stage before selecting requirements.
- Missing or ambiguous organization requirements are a destination-layer evidence gap, not a new finding. Do not declare organization readiness from core results alone.
- A missing readable artifact may be a deterministic failure only when the rule says the artifact must exist.
- Missing historical, execution, repository-setting, or external evidence is `UNABLE TO DETERMINE`, not `FAIL`, unless readable evidence directly contradicts the rule.
- Scenario fit requires the documentation, configuration, resource declarations, and tracked-file state defined by the applicable rule. If any named evidence is absent or unreadable, return `UNABLE TO DETERMINE`.
- External validation automation is evidence, not authority. A run establishes only the checks it records, and a failing run whose recorded checks map to no active rule does not establish a failure.
- Rule modules use short keys (`applies`, `inspect`, `pass`, `fail`, `unknown`) with the same meaning as the corresponding schema fields above.
