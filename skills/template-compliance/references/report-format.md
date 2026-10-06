# Compliance Report Contract

Return one report in Markdown. Be concise and evidence-backed.

## Header

- **Scope:** inspected target paths or identifiers
- **Catalog:** bundled catalog identity/version if present
- **Policy baseline:** upstream revision and any interpretation relevant to this target
- **Revision:** inspected commit and working-tree state, or the evidence gap
- **Inspection mode:** read-only
- **Overall result:** `PASS`, `FAIL`, `UNABLE TO DETERMINE`, or `NO ACTIVE APPLICABLE RULES`

Overall result rules:

1. `FAIL` if any finding fails.
2. Otherwise, `UNABLE TO DETERMINE` if any finding is indeterminate.
3. Otherwise, `PASS` if at least one applicable rule passes.
4. Otherwise, `NO ACTIVE APPLICABLE RULES`.

Never describe the fourth result as compliant.

## Summary

Provide counts for applicable rules, pass, fail, and unable to determine. Counts must equal the detailed findings.

## Findings

Use one subsection or table row per rule-target pair:

- **Rule:** ID and title
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
