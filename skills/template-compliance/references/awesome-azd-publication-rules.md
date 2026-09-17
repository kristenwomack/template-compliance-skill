# Awesome AZD Publication Rules

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
    requirement: The repository description MUST state the deployed scenario, and topics MUST include the required repository topics plus at least one language, model, or technology topic that describes the template.
    applies: Explicit Awesome AZD publication readiness.
    inspect: GitHub repository description and topics, plus README.md or azure.yaml for scenario, language, model, and technology terms.
    pass: The non-empty description states the deployed scenario, and the topics include azd-templates and ai-azd-templates plus at least one language, model, or technology term present in README.md or azure.yaml.
    fail: Readable metadata shows an empty description, no topics, topics that omit azd-templates or ai-azd-templates, or no language, model, or technology topic.
    unknown: Repository metadata, README.md, or azure.yaml is unreadable, or the description and topics cannot be compared with repository evidence.
    remediation: Set a repository description that states the scenario, and add the required repository topics plus the language, model, and technology topics the template uses.
  - id: AZD-AWESOME-004
    <<: *defaults
    version: 2
    title: Reviewable validation evidence
    requirement: Reviewers MUST be able to access evidence of a successful validation, test, or manual verification that identifies the audited commit.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Supplied or linked PRs, workflow runs, screenshots, or logs, including the checks each record states it performed.
    pass: A readable record identifies the audited commit and a successful validation, test, or manual verification; no record for that commit reports a failure of a check that maps to an active rule.
    fail: A readable record identifying the audited commit reports a failed check that maps to an active rule in this catalog.
    unknown: No supplied record identifies the audited commit, a cited record is unreadable, or the only failing record's checks map to no active rule.
    remediation: Produce and retain readable successful validation evidence for the audited commit outside this read-only audit.
```
