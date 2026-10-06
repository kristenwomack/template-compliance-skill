# Compliance Report Contract

Return one report in Markdown per target/profile pair. Be concise and
evidence-backed. When several targets or destinations are requested, keep their
reports separate; repeated rule IDs across different reports are not duplicates.
The deterministic grader evaluates one target/profile report at a time.

## Header

- **Scope:** inspected target paths or identifiers
- **Destination profile:** `core-only`, `public-awesome-azd`, `organization-catalog`, or `unresolved`
- **Public stage:** `preparation` or `submission` for public reports; otherwise omit
- **Catalog:** bundled catalog identity/version if present
- **Policy baseline:** upstream revision and any interpretation relevant to this target
- **Revision:** inspected commit and working-tree state, or the evidence gap
- **Inspection mode:** read-only
- **Organization policy:** selected ID, version, owner, location and approval reference for organization reports, or the policy-resolution gap
- **Core readiness:** `PASS`, `FAIL`, `UNABLE TO DETERMINE`, or `NO ACTIVE APPLICABLE RULES`
- **Destination readiness:** the same four verdicts for a selected collection, or `NOT ASSESSED` for core-only/unresolved profiles
- **Overall result:** `PASS`, `FAIL`, `UNABLE TO DETERMINE`, or `NO ACTIVE APPLICABLE RULES`

Overall result rules:

1. Derive core readiness from core findings and destination readiness from applicable destination findings: FAIL if any fail, otherwise UNABLE TO DETERMINE if any are indeterminate, otherwise PASS if at least one passes, otherwise NO ACTIVE APPLICABLE RULES.
2. Missing, inaccessible, invalid, unapproved, or unresolved-applicability organization policy sets destination readiness to UNABLE TO DETERMINE, even when all core findings pass. No policy-gap finding is fabricated.
3. Overall result is `FAIL` if any finding or assessed layer fails.
4. Otherwise, `UNABLE TO DETERMINE` if any finding/layer is indeterminate or a selected collection has NO ACTIVE APPLICABLE RULES. That empty destination does not establish readiness.
5. Otherwise, `PASS` if at least one applicable rule passes.
6. Otherwise, `NO ACTIVE APPLICABLE RULES`.

Never describe NO ACTIVE APPLICABLE RULES as compliant. For core-only or unresolved
profiles, overall result covers core only; destination is NOT ASSESSED and must
not be described as ready for any collection. A valid empty organization policy
must be described as having no active applicable rules, not as approved readiness.

Keep readiness labels distinct from finding Status fields and summary count
labels. Use the exact labels above so automated graders can distinguish layers.

## Summary

Provide combined counts for applicable rules, pass, fail, and unable to determine.
Counts must equal the detailed findings. Policy-resolution gaps, excluded public
rules, recommendations, and readiness labels are not findings and are not counted.

## Findings

Use one subsection or table row per rule-target pair:

- **Rule:** ID and title
- **Layer:** `core` or `destination`
- **Target:** exact inspected target
- **Status:** `PASS`, `FAIL`, or `UNABLE TO DETERMINE`
- **Evidence:** exact path, field, and line/range when available; quote only the minimum necessary content
- **Rationale:** connect the cited evidence to the rule criteria
- **Policy basis:** source requirement and any local evidence safeguard affecting the conclusion; distinguish both from validator defaults
- **Remediation:** required for `FAIL`; propose a specific change without applying it
- **Evidence needed:** required for `UNABLE TO DETERMINE`; state what would resolve uncertainty

Do not cite evidence that was not inspected. Do not expose secrets or unnecessary target content.

## Guidance

When useful, provide source-backed Recommended or Optional next actions separately
from findings. They have no compliance status, are excluded from counts, and
cannot change the overall result.

## Limitations and integrity

List inaccessible targets, unsupported formats, assumptions, source conflicts, and catalog gaps. Do not imply official certification or guaranteed collection acceptance. End with:

> No target templates were modified.
