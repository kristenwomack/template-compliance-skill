# Compliance Rule Catalog

The canonical bundled policy is [catalog.json](../catalog.json). This index and
the generated rule views support human review and manual fallback; the normal
audit uses the checker's profile-filtered payload instead of loading all modules.
Enforce only entries with `status: active` and `policy_kind: approved`. For internal
catalogs, use user-selected existing documents, not this catalog's schema.

Edit bundled rules and module introductions in `catalog.json`, then run
`npm run catalog:generate` from the repository root. Generated YAML views are not
independently editable policy. `npm run catalog:check` rejects stale views.

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

## Runtime ownership

Profile/stage selection is defined in [policy-profiles.md](policy-profiles.md);
organization-source handling in [organization-policy.md](organization-policy.md);
verdicts and counts in [report-format.md](report-format.md). The catalog supplies
applicable evidence safeguards with the runtime payload. Source history and
conflict explanations in [policy-sources.md](policy-sources.md) are on-demand
documentation, not a required additional read for every audit.

Rule views use short keys (`applies`, `inspect`, `pass`, `fail`, `unknown`) with
the same meaning as the corresponding schema fields above. `layer` and `stages`
select core versus public destination rules and preparation versus submission.
