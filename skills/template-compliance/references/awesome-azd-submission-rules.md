# Awesome AZD Submission Rules

Authority: this repository-owned rule module, as indexed by [compliance-rules.md](compliance-rules.md).

Apply only when public Awesome AZD publication intent is explicit. Interpret defined terms using [awesome-azd-rules.md](awesome-azd-rules.md).

```yaml
defaults: &defaults
  version: 1
  status: active
  policy_kind: approved
  authority: "template-compliance repository-owned catalog"
  rationale: Required by the active approved Awesome AZD catalog.
  severity: collection-required
  references: ["compliance-rules.md", "awesome-azd-rules.md"]
rules:
  - id: AZD-AWESOME-005
    <<: *defaults
    title: Gallery metadata and asset
    requirement: Submission MUST prepare title, short description, source link, author, gallery image, technology/language/framework/Azure-service/IaC tags, and a unique template UUID.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Prepared Awesome AZD submission metadata and referenced image.
    pass: Every listed metadata field is non-empty, the UUID parses as a UUID, and the image is a readable file or its URL returns a successful response.
    fail: Readable submission data shows an empty field, an unparsable UUID, an absent image, or an image URL with a non-success response.
    unknown: Submission data is unreadable, or image content or its URL response cannot be read.
    remediation: Prepare the missing gallery metadata or image required by this catalog rule.
  - id: AZD-AWESOME-006
    <<: *defaults
    title: Submission process
    requirement: Awesome AZD submissions MUST use one of the submission-authority paths.
    applies: An explicit in-progress Awesome AZD submission.
    inspect: Submission pull request or automated template-submission issue.
    pass: Readable submission evidence is a direct Awesome AZD pull request or automated template-submission issue.
    fail: Readable submission evidence uses neither submission-authority path.
    unknown: Submission evidence is absent or unreadable.
    remediation: Use a direct Awesome AZD pull request or the automated template-submission issue.
  - id: AZD-AWESOME-007
    <<: *defaults
    title: Required README headings
    requirement: README.md MUST contain each required README heading as an H2 heading.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Root README.md heading structure, or a validation record that names the heading set it checked.
    pass: Readable README.md contains every required README heading as an H2 heading.
    fail: A readable listing proves README.md is absent, or readable README.md omits a required README heading or carries one only at another heading level.
    unknown: README.md is unreadable, or the only offered evidence is a validation record that does not name the heading set it checked.
    remediation: Add the missing H2 headings to README.md and move existing content under the matching heading.
  - id: AZD-AWESOME-008
    <<: *defaults
    title: Security validation result
    requirement: The security validation MUST pass without warnings.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Supplied or readable security validation output that identifies the audited commit.
    pass: A readable security validation record identifies the audited commit and reports the analysis completing with no warnings and no errors.
    fail: A readable security validation record identifies the audited commit and reports one or more warnings or errors.
    unknown: No security validation record identifies the audited commit, a cited record is unreadable, or the cited run did not perform the security analysis.
    remediation: Resolve the reported security findings, such as using Microsoft Entra ID or a managed identity where supported and removing exposed secrets, then re-run the validation outside this read-only audit.
```
