# Awesome AZD Rules

Authority: this repository-owned rule module, as indexed by [compliance-rules.md](compliance-rules.md).

Apply these only when public Awesome AZD publication intent is explicit. All have `status: active`, `policy_kind: approved`, and `severity: collection-required`. Each rule states its own `version`; rules default to `version: 1` and carry an explicit `version` when revised.

## Evaluation terms

- **Audited commit:** the target repository commit named in the report. Validation evidence is fresh only when it identifies that commit.
- **Submission authority:** the repository-owned catalog recognizes exactly two paths: a direct Awesome AZD pull request or the automated template-submission issue.
- **Required README headings:** the literal H2 headings `## Important Security Notice`, `## Features`, `## Getting Started`, `## Guidance`, and `## Resources`, which the collection validator asserts. `AZD-AWESOME-001` evaluates README content topics and `AZD-AWESOME-007` evaluates this heading structure; evaluate them independently.
- **Required repository topics:** `azd-templates` and `ai-azd-templates`, alongside the language, model, and technology topics that describe the template.
- **Security validation:** the [PSRule for Azure](https://azure.github.io/PSRule.Rules.Azure/features/#learn-by-example) analysis that the collection's validation automation runs by default.
- **Recorded checks:** a validation run establishes only the checks it records. A run that does not record the required-README-headings check does not establish `AZD-AWESOME-007`, and a failing run whose recorded checks map to no active rule in this catalog — for example a missing dev container or `azure-dev` workflow — does not establish a failure.
- When validation records for the audited commit disagree, a recorded failure takes precedence over a success. When repository data, linked evidence, an image, or a submission record cannot be read, use the rule's `unknown` outcome; do not infer its contents.

```yaml
defaults: &defaults
  version: 1
  status: active
  policy_kind: approved
  authority: "template-compliance repository-owned catalog"
  rationale: Required by the active approved Awesome AZD catalog.
  severity: collection-required
  references: ["compliance-rules.md"]
rules:
  - id: AZD-AWESOME-001
    <<: *defaults
    title: Publication README
    requirement: README.md MUST explain the scenario, prerequisites, deployment steps, verification steps, and cleanup guidance.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Root README.md.
    pass: README.md names the deployed scenario, states prerequisites or that there are none, gives deployment commands, gives a verification action and expected result, and gives a cleanup command or procedure.
    fail: A readable README is absent or one or more topics are absent.
    unknown: README.md is unreadable or its text does not distinguish one or more required topics.
    remediation: Add the missing publication-readiness topics to README.md.
  - id: AZD-AWESOME-002
    <<: *defaults
    title: OSS governance files
    requirement: LICENSE.md, SECURITY.md, CONTRIBUTING.md, .github/CODE_OF_CONDUCT.md, and an issue template MUST be present.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Root and .github file listings.
    pass: Every named artifact and at least one issue template are present.
    fail: A readable listing proves any required artifact absent.
    unknown: Required listings are inaccessible.
    remediation: Add the missing baseline OSS or governance artifacts.
  - id: AZD-AWESOME-003
    <<: *defaults
    version: 2
    title: Repository discoverability
    requirement: The repository description MUST state the deployed scenario, and topics MUST include the required repository topics defined above plus at least one language, model, or technology topic that describes the template.
    applies: Explicit Awesome AZD publication readiness.
    inspect: GitHub repository description and topics, plus README.md or azure.yaml for scenario, language, model, and technology terms.
    pass: The non-empty description states the deployed scenario, and the topics include azd-templates and ai-azd-templates plus at least one language, model, or technology term present in README.md or azure.yaml.
    fail: Readable metadata shows an empty description, no topics, topics that omit azd-templates or ai-azd-templates, or no language, model, or technology topic.
    unknown: Repository metadata, README.md, or azure.yaml is unreadable, or the description and topics cannot be compared with repository evidence.
    remediation: Set a repository description that states the scenario, and add the azd-templates and ai-azd-templates topics plus the language, model, and technology topics the template uses.
  - id: AZD-AWESOME-004
    <<: *defaults
    version: 2
    title: Reviewable validation evidence
    requirement: Reviewers MUST be able to access evidence of a successful validation, test, or manual verification that identifies the audited commit.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Supplied or linked PRs, workflow runs, screenshots, or logs, including the checks each record states it performed.
    pass: A readable PR, workflow run, screenshot, or log identifies the audited commit and records a successful validation, test, or manual verification; no record for that commit reports a failure of a check that maps to an active rule.
    fail: A readable record identifying the audited commit reports a failed check that maps to an active rule in this catalog.
    unknown: No supplied record identifies the audited commit, a cited record is unreadable, or the only failing record's recorded checks map to no active rule in this catalog.
    remediation: Produce and retain readable successful validation evidence for the audited commit outside this read-only audit.
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
    requirement: Awesome AZD submissions MUST use one of the submission-authority paths defined above.
    applies: An explicit in-progress Awesome AZD submission.
    inspect: Submission pull request or automated template-submission issue.
    pass: Readable submission evidence is a direct Awesome AZD pull request or automated template-submission issue.
    fail: Readable submission evidence uses neither submission-authority path.
    unknown: Submission evidence is absent or unreadable.
    remediation: Use a direct Awesome AZD pull request or the automated template-submission issue.
  - id: AZD-AWESOME-007
    <<: *defaults
    title: Required README headings
    requirement: README.md MUST contain each required README heading defined above as an H2 heading.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Root README.md heading structure, or a validation record that names the heading set it checked.
    pass: Readable README.md contains every required README heading as an H2 heading.
    fail: A readable listing proves README.md is absent, or readable README.md omits a required README heading or carries one only at another heading level.
    unknown: README.md is unreadable, or the only offered evidence is a validation record that does not name the heading set it checked.
    remediation: Add the missing H2 headings to README.md and move existing content under the matching heading.
  - id: AZD-AWESOME-008
    <<: *defaults
    title: Security validation result
    requirement: The security validation defined above MUST pass without warnings.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Supplied or readable security validation output that identifies the audited commit.
    pass: A readable security validation record identifies the audited commit and reports the analysis completing with no warnings and no errors.
    fail: A readable security validation record identifies the audited commit and reports one or more warnings or errors.
    unknown: No security validation record identifies the audited commit, a cited record is unreadable, or the cited run did not perform the security analysis.
    remediation: Resolve the reported security findings, such as using Microsoft Entra ID or a managed identity where the service supports it and removing exposed secrets, then re-run the validation outside this read-only audit.
```
