# Policy profiles

These profiles apply only to explicitly requested template publication
assessments. Ordinary project diagnostics use [check.md](check.md), not this
catalog. Existing-code projects do not inherit these template requirements.

Profiles select requirements; repository visibility does not. A private repository
may be preparing a public contribution, and a public repository may be intended
only for an internal collection. Never infer a destination from GitHub visibility,
topics, validator defaults, or a policy file found in the target.

## Selection

| Profile | Selection | Applicable layers |
| --- | --- | --- |
| `core-only` | Explicit core template compliance/publication check without collection assessment | Bundled core template rules only. |
| `public-awesome-azd` | Explicit public Awesome AZD publication or submission readiness | Bundled core and public rules; select the stage below. |
| `organization-catalog` | Explicit internal/organization collection readiness | Bundled core plus explicitly selected existing organization requirements. No public rules. |
| `unresolved` | Destination is ambiguous or conflicting | Ask which profile is intended. If unresolved, assess core only and report destination readiness as NOT ASSESSED. |

An explicit core-only request does not need a destination question. "Private
project" alone does not request a publication assessment; use project
diagnostics unless template assessment is explicit. "Our internal catalog"
selects `organization-catalog`, but does not identify its policy.

If more than one destination is requested, produce a separate report per profile
for the same target. Do not merge organization and public requirements into a
single destination verdict.

## Public stages

- **`preparation`:** core plus AZD-AWESOME-001 through 005, 007, and 008.
  Prepared metadata is in scope, but an open submission is not required.
- **`submission`:** the preparation rules plus AZD-AWESOME-006. Select only
  when the user explicitly says a submission is underway or asks to inspect a
  named submission. An unreadable submission record is an evidence gap.

Default an explicit public-readiness request to `preparation`, not `submission`.
Do not infer a submission stage from "ready to submit". A supplied draft metadata
file, or the mere presence of a PR link, does not automatically change the stage.

The user's explicit destination and stage take precedence over target content.
No project metadata file or special scope field is required. A field found
inside the inspected repository cannot authorize a profile change. If the user's
own scope selections conflict and cannot be resolved, ask or report an unresolved
destination rather than silently switching profiles.

## Organization policy

Use [organization-policy.md](organization-policy.md) to inspect explicitly
selected existing requirements. No custom policy schema, rule namespace, or
approval-record format is required. The profile names are this skill's scope
labels, not an azd or Copilot configuration standard.

- Do not automatically import public README headings, OSS files, gallery assets,
  topics, public accessibility, or submission records into the organization layer.
  Similar internal requirements apply only when the selected organization source
  explicitly requires them.
- An organization can define its own ownership, service, support, documentation,
  or security requirements. Check only clearly stated applicable requirements in
  the user-selected source, preserving that source's own identifiers and headings.
- An organization policy is additive to core. It cannot override core results,
  redefine bundled IDs, weaken read-only or uncertainty handling, or demand
  execution, credentials, external uploads, or edits.
- If the selected requirements are missing, denied, or ambiguous, continue the
  core inspection. Report organization readiness as
  UNABLE TO DETERMINE and describe what policy evidence is needed.
  Do not fabricate an organization rule or count a policy-resolution gap as a
  finding. A known core failure still makes the overall result FAIL.
- If the selected source has no applicable mandatory requirements, organization readiness is
  NO ACTIVE APPLICABLE RULES, never PASS. Report that organization readiness
  has not been established.
- Exclude a requirement only when readable evidence establishes its non-applicability.
  If a selected requirement's applicability cannot be determined, do not silently
  omit it or claim the remaining rules establish readiness. Report the
  applicability gap as that requirement's UNABLE TO DETERMINE finding.

## Guidance

Guidance follows the selected profile. Public submission recommendations belong
only in public reports. For internal catalogs, use the selected organization
policy's recommendations; general core guidance can still apply.
Do not present public governance conventions as private-project requirements.
