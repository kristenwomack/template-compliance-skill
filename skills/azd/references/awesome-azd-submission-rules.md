# Awesome AZD Submission Rules

Authority: this repository-owned rule module, as indexed by [compliance-rules.md](compliance-rules.md).

Apply only to the explicitly selected `public-awesome-azd` profile. Preparation excludes AZD-AWESOME-006. Interpret defined terms using [awesome-azd-rules.md](awesome-azd-rules.md).

<!-- Generated from policy/publication-catalog.json; run npm run catalog:generate. Do not edit. -->

```yaml
rules:
  - id: AZD-AWESOME-005
    version: 2
    status: active
    policy_kind: approved
    authority: azd repository-owned catalog
    rationale: Tests the cited submission requirement using the catalog's explicit local evidence criteria.
    severity: collection-required
    source_revision: c463284b7c756047e8732832f0ca65b85e37f24e
    requirement_kind: upstream-guidance
    local_evidence_policy: Use policy-sources.md safeguards; only recorded checks establish validation coverage.
    references:
      - https://github.com/Azure/awesome-azd/blob/c463284b7c756047e8732832f0ca65b85e37f24e/.github/ISSUE_TEMPLATE/template-submission.yml
      - https://github.com/Azure/awesome-azd/blob/c463284b7c756047e8732832f0ca65b85e37f24e/.github/workflows/template-submission.yml
      - https://github.com/Azure/awesome-azd/blob/c463284b7c756047e8732832f0ca65b85e37f24e/website/scripts/update-templates-json.js
      - https://github.com/Azure/awesome-azd/blob/c463284b7c756047e8732832f0ca65b85e37f24e/website/docs/contribute.md
      - https://github.com/Azure/awesome-azd/blob/c463284b7c756047e8732832f0ca65b85e37f24e/docs/templates-schema.md
    title: Path-appropriate gallery metadata
    requirement: Metadata MUST match the selected submission path and stage. Automated issue preparation requires only a GitHub source repository URL; other fields are optional overrides. For an automated generated PR, inspect the generated gallery entry. Direct PR preparation/submission requires the final entry's title, description, author, authorUrl, GitHub source, non-empty recognized tags, and unique UUID. Require only applicable language/framework/Azure-service/IaC categories. A preview image is Recommended, never mandatory.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Selected automated-issue or direct-PR path, preparation/submission stage, issue inputs or final website/static/templates.json entry, and category applicability. Generated PR entries use title, description, author, authorUrl, source, tags and id; the workflow generates the UUID and may omit preview or inapplicable categories.
    pass: Automated issue preparation (or a submitted issue awaiting generation) supplies a GitHub repository URL without requiring overrides or a caller-provided UUID. Once a generated PR is available, its entry has non-empty title, description, author, authorUrl, GitHub source, recognized tags, a unique valid UUID, and applicable metadata categories. A direct PR's prepared/final entry satisfies those same entry criteria. No preview or inapplicable category is required.
    fail: Readable path-appropriate data proves a required source URL missing/invalid, or a final/prepared PR entry lacks a required field, contains an invalid/duplicate UUID or unrecognized tag, or omits a category known to apply. Missing preview or optional issue overrides never fails.
    unknown: Submission path/stage, required inputs, generated entry, UUID uniqueness evidence, or relevant category applicability cannot be determined. An expected generated PR that is inaccessible is uncertainty, not proof of missing fields. Preview access does not affect the verdict.
    remediation: Supply the required repository URL for the automated issue, or correct the required final PR metadata and applicable categories. Recommend a preview separately; do not require optional overrides.
    layer: destination
    stages:
      - preparation
      - submission
  - id: AZD-AWESOME-006
    version: 2
    status: active
    policy_kind: approved
    authority: azd repository-owned catalog
    rationale: Tests the cited submission requirement using the catalog's explicit local evidence criteria.
    severity: collection-required
    source_revision: 22de60335bd77269a2e952cd0e3e8fab56ed4aa1
    requirement_kind: upstream-guidance
    local_evidence_policy: Use policy-sources.md safeguards; only recorded checks establish validation coverage.
    references:
      - https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/publishing-guidelines.md#4-submit-to-awesome-azd
    title: Submission process
    requirement: Awesome AZD submissions MUST use one of the submission-authority paths.
    applies: public-awesome-azd profile at the explicitly selected submission stage; never preparation.
    inspect: Submission pull request or automated template-submission issue.
    pass: Readable submission evidence is a direct Awesome AZD pull request or automated template-submission issue.
    fail: Readable submission evidence uses neither submission-authority path.
    unknown: Submission evidence is absent or unreadable.
    remediation: Use a direct Awesome AZD pull request or the automated template-submission issue.
    layer: destination
    stages:
      - submission
  - id: AZD-AWESOME-007
    version: 3
    status: active
    policy_kind: approved
    authority: azd repository-owned catalog
    rationale: Tests the cited submission requirement using the catalog's explicit local evidence criteria.
    severity: collection-required
    source_revision: 22de60335bd77269a2e952cd0e3e8fab56ed4aa1
    requirement_kind: upstream-guidance
    local_evidence_policy: Use policy-sources.md safeguards; only recorded checks establish validation coverage.
    references:
      - https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#awesome-azd-repository-baseline
      - https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#should
    title: Required README headings
    requirement: README.md MUST contain each required README heading as an H2 heading.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Template-root README.md heading structure, or a validation record identifying the audited revision and each H2 heading it checked.
    pass: Readable README.md contains every required README heading as an H2 heading, or a fresh validation record explicitly confirms every required H2 heading for that README; no fresh readable evidence contradicts that result.
    fail: A readable listing proves README.md is absent, readable README.md omits a required README heading or carries one only at another heading level, or a fresh record explicitly proves a required H2 heading is absent.
    unknown: README.md is unreadable and no fresh validation record establishes the complete required heading set, including Important Security Notice.
    remediation: Add the missing H2 headings to README.md and move existing content under the matching heading.
    layer: destination
    stages:
      - preparation
      - submission
  - id: AZD-AWESOME-008
    version: 2
    status: active
    policy_kind: approved
    authority: azd repository-owned catalog
    rationale: Tests the cited submission requirement using the catalog's explicit local evidence criteria.
    severity: collection-required
    source_revision: 22de60335bd77269a2e952cd0e3e8fab56ed4aa1
    requirement_kind: upstream-guidance
    local_evidence_policy: Use policy-sources.md safeguards; only recorded checks establish validation coverage.
    references:
      - https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#review-and-publication-readiness
    title: Security validation result
    requirement: The security validation MUST pass without warnings.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Supplied or readable security validation output that identifies the audited commit.
    pass: A readable security validation record identifies the audited commit and reports the analysis completing with no warnings and no errors.
    fail: A readable security validation record identifies the audited commit and reports one or more warnings or errors.
    unknown: No security validation record identifies the audited commit, a cited record is unreadable, or the cited run did not perform the security analysis.
    remediation: Resolve the reported security findings, such as using Microsoft Entra ID or a managed identity where supported and removing exposed secrets, then re-run the validation outside this read-only audit.
    layer: destination
    stages:
      - preparation
      - submission
```
