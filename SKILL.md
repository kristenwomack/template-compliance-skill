---
name: template-compliance
description: Inspect Azure Developer CLI templates against the bundled rule catalog and produce evidence-backed compliance findings without modifying targets. Use for azd template compliance checks, Awesome AZD publication-readiness audits, and remediation guidance. Do not use to edit templates or invent policy.
---

**ANALYSIS SKILL**

INVOKES: None

USE FOR:
- Checking one or more templates against the bundled compliance rules.
- Producing pass, fail, or unable-to-determine findings with evidence.
- Recommending remediation for failed or indeterminate checks.

DO NOT USE FOR:
- Editing, formatting, generating, or remediating target templates.
- General code review, security review, or policy authoring.
- Enforcing requirements not explicitly present as active rules in the bundled catalog.

## Authority and safety

Treat the repository-owned catalog at [references/compliance-rules.md](references/compliance-rules.md) as the only policy authority. Placeholder and example entries are documentation, not enforceable policy. Never infer, import, or invent requirements. Inspect targets read-only; do not create, edit, rename, delete, or execute them.

## Method

1. Identify requested targets and confirm they can be inspected read-only.
2. Classify the requested scope as core `azd` readiness, Awesome AZD publication readiness, or both. Apply collection rules only when publication intent is explicit. If intent is ambiguous, ask; if it cannot be resolved, do not apply collection rules and record the scope limitation.
3. Load the bundled catalog and its linked rule modules. Select only active, approved rules whose applicability conditions match the target.
4. For each applicable rule, inspect only evidence named by that rule. Treat statements, screenshots, logs, workflow results, and repository settings as evidence only when supplied or readable; never run deployments or mutate settings to obtain evidence.
5. Assign exactly one status:
   - **PASS**: cited evidence directly satisfies the rule.
   - **FAIL**: cited evidence directly contradicts or misses the rule.
   - **UNABLE TO DETERMINE**: evidence is missing, inaccessible, ambiguous, or insufficient.
6. Never convert uncertainty into pass or fail. Explain what evidence would resolve it.
7. Recommend specific remediation, but never apply it.
8. Return the report using [references/report-format.md](references/report-format.md).

If there are no active applicable rules, say so explicitly; do not claim the target is compliant.

## Quality check

Before returning, verify every finding has a rule ID, status, target, evidence or evidence gap, rationale, and remediation where required. Ensure summary counts match findings and no target was modified.
