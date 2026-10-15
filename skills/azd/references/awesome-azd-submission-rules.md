# Awesome AZD Submission Rules

Authority: this repository-owned rule module, as indexed by [compliance-rules.md](compliance-rules.md).

Apply only to the explicitly selected `public-awesome-azd` profile. Preparation excludes AZD-AWESOME-006. Interpret defined terms using [awesome-azd-rules.md](awesome-azd-rules.md).

<!-- Generated from policy/publication-catalog.json; run npm run catalog:generate. Do not edit. -->

```yaml
rules:
  - id: AZD-AWESOME-005
    version: 1
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
    title: Gallery metadata and asset
    requirement: Submission MUST prepare title, short description, source link, author, gallery image, technology/language/framework/Azure-service/IaC tags, and a unique template UUID.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Prepared Awesome AZD submission metadata and referenced image.
    pass: Every listed metadata field is non-empty, the UUID parses as a UUID, and the image is a readable file or its URL returns a successful response.
    fail: Readable submission data shows an empty field, an unparsable UUID, an absent image, or an image URL with a non-success response.
    unknown: Submission data is unreadable, or image content or its URL response cannot be read.
    remediation: Prepare the missing gallery metadata or image required by this catalog rule.
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
