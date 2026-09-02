# 🧭 template-compliance

Welcome! `template-compliance` is a standalone analysis skill that helps you inspect Azure Developer CLI (`azd`) templates against a bundled, repository-owned rule catalog. Every inspection is read-only, so the skill reports what it finds without changing the template.

## 📦 Install

To get started, copy this directory into the skills location supported by your agent runtime. Keep the installed directory name and frontmatter name as `template-compliance`. The skill does not bundle or assume a runtime-specific installer.

## 🔍 Use

Ask your agent to inspect named template files or directories for compliance. The skill:

- uses only active rules in `references/compliance-rules.md`;
- reports `PASS`, `FAIL`, or `UNABLE TO DETERMINE`;
- cites evidence or describes the evidence gap;
- proposes, but never applies, remediation; and
- never edits target templates.

Example request:

> Check this repository for core azd template compliance and return the compliance report.

Ask explicitly for **Awesome AZD publication readiness** when collection rules should also apply. The skill does not assume publication intent. If scope cannot be resolved, it limits the inspection to core rules and reports the limitation.

The bundled, repository-owned catalog is the skill's only compliance authority. Active approved rules define enforceable requirements; descriptive guidance, optional enhancements, and optional repository assets such as dev containers or CI/CD pipeline definitions are not compliance failures. External validation automation is evidence, not authority: a run establishes only the checks it records. Review and version catalog changes in this repository so the policy stays clear and intentional.

## 🛠️ Customize policy

The catalog is designed to grow with your needs. Edit the modules indexed by `references/compliance-rules.md` and add organization-approved rules using its schema. Give each rule a stable ID, explicit applicability, evidence instructions, deterministic pass/fail criteria, and remediation. Placeholder or example rules are never enforced.

Keep policy interpretation out of `SKILL.md`: the catalog is authoritative.

## 🧪 Evaluate

The repository includes runner-neutral evaluation fixtures. `evals/eval.yaml` indexes coverage for:

- correct routing;
- the report contract and remediation;
- ambiguous or missing evidence; and
- non-trigger behavior;
- optional-asset and validation-evidence limits;
- positive, negative, and ambiguity behavior for every active catalog rule.

The fixtures are declarative and do not assume a particular evaluation runner. Load them with a YAML-capable tool or adapt them to the evaluator used by your runtime. Review expected assertions manually if no evaluator is available.

## 🗂️ Layout

Here is where everything lives:

```text
template-compliance/
├── SKILL.md                         # Routing, constraints, and analysis workflow
├── references/
│   ├── compliance-rules.md          # Authoritative rule schema and catalog
│   ├── core-azd-rules.md            # Core azd requirements
│   ├── awesome-azd-rules.md         # Collection-specific requirements
│   └── report-format.md             # Required report contract
└── evals/
    ├── eval.yaml                    # Evaluation suite manifest
    └── tasks/
        └── *.yaml                   # Evaluation scenarios
```
