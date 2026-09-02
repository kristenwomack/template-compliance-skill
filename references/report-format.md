# Compliance Report Contract

Return one report in Markdown. Be concise and evidence-backed.

## Header

- **Scope:** inspected target paths or identifiers
- **Catalog:** bundled catalog identity/version if present
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
- **Remediation:** required for `FAIL`; propose a specific change without applying it
- **Evidence needed:** required for `UNABLE TO DETERMINE`; state what would resolve uncertainty

Do not cite evidence that was not inspected. Do not expose secrets or unnecessary target content.

## Limitations and integrity

List inaccessible targets, unsupported formats, assumptions, and catalog gaps. End with:

> No target templates were modified.
