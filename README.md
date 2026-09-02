# template-compliance

A standalone analysis skill for read-only inspection of Azure Developer CLI (`azd`) templates against a bundled, repository-owned rule catalog.

## Install

Copy this directory into the skills location supported by your agent runtime. The installed directory name and frontmatter name must remain `template-compliance`. No runtime-specific installer is bundled or assumed.

## Use

Ask the agent to inspect named template files or directories for compliance. The skill:

- uses only active rules in `references/compliance-rules.md`;
- reports `PASS`, `FAIL`, or `UNABLE TO DETERMINE`;
- cites evidence or describes the evidence gap;
- proposes, but never applies, remediation; and
- never edits target templates.

Example request:

> Check this repository for core azd template compliance and return the compliance report.

Ask explicitly for **Awesome AZD publication readiness** when collection rules should also apply. The skill does not assume publication intent. If scope cannot be resolved, it limits the inspection to core rules and reports the limitation.

The bundled, repository-owned catalog is the skill's only compliance authority. Active approved rules define enforceable requirements; descriptive guidance, optional enhancements, and optional repository assets such as dev containers or CI/CD pipeline definitions are not compliance failures. External validation automation is evidence, not authority: a run establishes only the checks it records. Review and version catalog changes in this repository.

## Customize policy

Edit the modules indexed by `references/compliance-rules.md` and add organization-approved rules using its schema. Give each rule a stable ID, explicit applicability, evidence instructions, deterministic pass/fail criteria, and remediation. Placeholder or example rules are never enforced.

Keep policy interpretation out of `SKILL.md`: the catalog is authoritative.

## Evaluate

`evals/eval.yaml` indexes runner-neutral YAML fixtures covering:

- correct routing;
- the report contract and remediation;
- ambiguous or missing evidence; and
- non-trigger behavior;
- optional-asset and validation-evidence limits;
- positive, negative, and ambiguity behavior for every active catalog rule.

The fixtures are declarative and do not assume a particular evaluation runner. Load them with a YAML-capable tool or adapt them to the evaluator used by your runtime. Review expected assertions manually if no evaluator is available.

## Layout

- `SKILL.md` — routing, constraints, and analysis workflow
- `references/compliance-rules.md` — authoritative rule schema and catalog
- `references/core-azd-rules.md` — repository-owned core `azd` requirements
- `references/awesome-azd-rules.md` — repository-owned collection-specific requirements
- `references/report-format.md` — required report contract
- `evals/eval.yaml` — evaluation suite manifest
- `evals/tasks/*.yaml` — evaluation scenarios
