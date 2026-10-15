# Awesome AZD Publication Rules

Authority: this repository-owned rule module, as indexed by [compliance-rules.md](compliance-rules.md).

Apply only to the explicitly selected `public-awesome-azd` profile, in preparation or submission. Interpret defined terms using [awesome-azd-rules.md](awesome-azd-rules.md).

<!-- Generated from policy/publication-catalog.json; run npm run catalog:generate. Do not edit. -->

```yaml
rules:
  - id: AZD-AWESOME-001
    version: 1
    status: active
    policy_kind: approved
    authority: azd repository-owned catalog
    rationale: Tests the cited publication requirement using the catalog's explicit local evidence criteria.
    severity: collection-required
    source_revision: 22de60335bd77269a2e952cd0e3e8fab56ed4aa1
    requirement_kind: upstream-guidance
    local_evidence_policy: Use policy-sources.md safeguards; validator defaults do not replace the pinned guidance.
    references:
      - https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#awesome-azd-repository-baseline
    title: Publication README
    requirement: README.md MUST explain the scenario, prerequisites, deployment steps, verification steps, and cleanup guidance.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Root README.md.
    pass: README.md names the deployed scenario, states prerequisites or that there are none, gives deployment commands, gives a verification action and expected result, and gives a cleanup command or procedure.
    fail: A readable README is absent or one or more topics are absent.
    unknown: README.md is unreadable or its text does not distinguish one or more required topics.
    remediation: Add the missing publication-readiness topics to README.md.
    layer: destination
    stages:
      - preparation
      - submission
  - id: AZD-AWESOME-002
    version: 1
    status: active
    policy_kind: approved
    authority: azd repository-owned catalog
    rationale: Tests the cited publication requirement using the catalog's explicit local evidence criteria.
    severity: collection-required
    source_revision: 22de60335bd77269a2e952cd0e3e8fab56ed4aa1
    requirement_kind: upstream-guidance
    local_evidence_policy: Use policy-sources.md safeguards; validator defaults do not replace the pinned guidance.
    references:
      - https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#awesome-azd-repository-baseline
    title: OSS governance files
    requirement: LICENSE.md, SECURITY.md, CONTRIBUTING.md, .github/CODE_OF_CONDUCT.md, and an issue template MUST be present.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Root and .github file listings.
    pass: Every named artifact and at least one issue template are present.
    fail: A readable listing proves any required artifact absent.
    unknown: Required listings are inaccessible.
    remediation: Add the missing baseline OSS or governance artifacts.
    layer: destination
    stages:
      - preparation
      - submission
  - id: AZD-AWESOME-003
    version: 2
    status: active
    policy_kind: approved
    authority: azd repository-owned catalog
    rationale: Tests the cited publication requirement using the catalog's explicit local evidence criteria.
    severity: collection-required
    source_revision: 22de60335bd77269a2e952cd0e3e8fab56ed4aa1
    requirement_kind: upstream-guidance
    local_evidence_policy: Use policy-sources.md safeguards; validator defaults do not replace the pinned guidance.
    references:
      - https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#awesome-azd-repository-baseline
    title: Repository discoverability
    requirement: The repository description MUST state the deployed scenario, and topics MUST include the required repository topics plus at least one language, model, or technology topic that describes the template.
    applies: Explicit Awesome AZD publication readiness.
    inspect: GitHub repository description and topics, plus README.md or azure.yaml for scenario, language, model, and technology terms.
    pass: The non-empty description states the deployed scenario, and the topics include azd-templates and ai-azd-templates plus at least one language, model, or technology term present in README.md or azure.yaml.
    fail: Readable metadata shows an empty description, no topics, topics that omit azd-templates or ai-azd-templates, or no language, model, or technology topic.
    unknown: Repository metadata, README.md, or azure.yaml is unreadable, or the description and topics cannot be compared with repository evidence.
    remediation: Set a repository description that states the scenario, and add the required repository topics plus the language, model, and technology topics the template uses.
    layer: destination
    stages:
      - preparation
      - submission
  - id: AZD-AWESOME-004
    version: 3
    status: active
    policy_kind: approved
    authority: azd repository-owned catalog
    rationale: Tests the cited publication requirement using the catalog's explicit local evidence criteria.
    severity: collection-required
    source_revision: 22de60335bd77269a2e952cd0e3e8fab56ed4aa1
    requirement_kind: upstream-guidance
    local_evidence_policy: Use policy-sources.md safeguards; validator defaults do not replace the pinned guidance.
    references:
      - https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#review-and-publication-readiness
    title: Reviewable validation evidence
    requirement: Reviewers MUST be able to access evidence of a successful validation, test, or manual verification that identifies the audited commit.
    applies: Explicit Awesome AZD publication readiness.
    inspect: Supplied or linked PRs, workflow runs, screenshots, or logs, including the checks each record states it performed.
    pass: A readable record identifies the audited commit and a successful validation, test, or manual verification; no record for that commit reports a failure of a check that maps to an active rule.
    fail: A readable record identifying the audited commit reports a failed check that maps to an active rule in this catalog.
    unknown: No supplied record identifies the audited commit, a cited record is unreadable, or the only failing record's checks map to no active rule.
    remediation: Produce and retain readable successful validation evidence for the audited commit outside this read-only audit.
    layer: destination
    stages:
      - preparation
      - submission
```
