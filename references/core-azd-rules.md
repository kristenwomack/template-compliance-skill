# Core `azd` Rules

Authority: this repository-owned rule module, as indexed by [compliance-rules.md](compliance-rules.md).

All rules below have `version: 1`, `status: active`, `policy_kind: approved`, and `severity: required`.

## Evaluation terms

- **Applicable azd schema:** the schema returned by the catalog-designated official azd schema URL, `https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-schema`. Record the URL and retrieval time. If the schema cannot be read, schema conformance is `UNABLE TO DETERMINE`.
- **Audited commit:** the target repository commit named in the report. Execution evidence is fresh only when it identifies that commit. Evidence for another commit does not establish the audited commit's result.
- **Scenario-fit evidence:** readable scenario documentation names the provisioned resource types, `azure.yaml` names the infrastructure path, and tracked files under that path declare those resource types. The infrastructure path is whichever path `azure.yaml` names; a specific directory name such as `infra/` is not required, and framework-specific equivalents are acceptable. If any part cannot be read, infrastructure fit is `UNABLE TO DETERMINE`.
- When fresh records disagree, a recorded failure takes precedence over a success. When a required file, external record, or authority cannot be read, use the rule's `unknown` outcome; do not infer its contents.

```yaml
defaults: &defaults
  version: 1
  status: active
  policy_kind: approved
  authority: "template-compliance repository-owned catalog"
  rationale: Required by the active approved core azd catalog.
  severity: required
  references: ["compliance-rules.md"]
rules:
  - id: AZD-CORE-001
    <<: *defaults
    title: Root azure.yaml
    requirement: azure.yaml MUST exist at the repository root.
    applies: Any azd template repository.
    inspect: Repository root file listing.
    pass: A readable root azure.yaml exists.
    fail: A readable root listing proves azure.yaml is absent.
    unknown: The root listing is inaccessible or repository root is unresolved.
    remediation: Add azure.yaml at the repository root.
  - id: AZD-CORE-002
    <<: *defaults
    title: azd schema conformance
    requirement: azure.yaml MUST conform to the applicable azd schema defined above.
    applies: Any azd template repository.
    inspect: Root azure.yaml, the recorded applicable-schema URL and retrieval time, and validator output for that schema.
    pass: Validator output identifies the applicable-schema URL and reports no schema errors for the inspected azure.yaml.
    fail: Validator output identifies the applicable-schema URL and reports one or more schema errors for the inspected azure.yaml.
    unknown: azure.yaml or the applicable schema is unreadable, or validator output tied to both is absent.
    remediation: Correct the reported errors against the applicable azd schema.
  - id: AZD-CORE-003
    <<: *defaults
    title: Infrastructure assets
    requirement: Tracked infrastructure files under the azure.yaml infrastructure path MUST declare every provisioned resource type named in the scenario documentation, per the scenario-fit evidence defined above.
    applies: Any azd template repository.
    inspect: Scenario docs, azure.yaml infra configuration, and tracked infrastructure assets.
    pass: Scenario documentation names the provisioned resource types, azure.yaml names the infrastructure path, and tracked files under that path declare each named resource type.
    fail: Readable scenario documentation names a provisioned resource type that is absent from the readable tracked files under the azure.yaml infrastructure path, or a required infrastructure file is untracked.
    unknown: Scenario documentation or azure.yaml is unreadable, provisioned resource types or the infrastructure path are not stated, or tracked-file state cannot be read.
    remediation: Commit the infrastructure assets required by the documented scenario.
  - id: AZD-CORE-004
    <<: *defaults
    title: Documented azd up path contents
    requirement: The repository MUST include readable documentation for its azd up path and every code or configuration path that documentation identifies.
    applies: Any azd template repository.
    inspect: Documented azd up path and referenced code and configuration.
    pass: Readable tracked documentation states the azd up sequence and names its code and configuration paths, and every named path is present, tracked, and readable.
    fail: The documented path references a required component proven absent.
    unknown: The documented azd up path is unreadable or does not name its required code and configuration, or repository file state cannot be read.
    remediation: Add or correct the azd up documentation and each code or configuration path it identifies.
  - id: AZD-CORE-005
    <<: *defaults
    title: Successful azd up verification
    requirement: The documented azd up happy path MUST have been executed successfully.
    applies: Any azd template repository.
    inspect: Supplied or readable workflow run, validation record, log, PR evidence, or manual verification record that identifies the audited commit and documented azd up path.
    pass: Evidence identifies the audited commit and documented azd up path and records a successful execution; no evidence for that commit records a failure.
    fail: Evidence identifying the audited commit and documented azd up path records a failed execution.
    unknown: No execution record identifies both the audited commit and documented azd up path, or a cited record is unreadable.
    remediation: Run the documented happy path outside this read-only audit and retain reviewable evidence.
  - id: AZD-CORE-006
    <<: *defaults
    title: Verified teardown
    requirement: If the template provisions Azure resources, its documented teardown path MUST be verified using azd down or an explicitly documented equivalent.
    applies: Templates that provision Azure resources.
    inspect: Provisioning docs, teardown docs, and supplied or readable verification evidence.
    pass: Provisioning documentation states that Azure resources are created, names azd down or an explicit equivalent, and evidence identifying the audited commit records successful teardown with that path.
    fail: Evidence proves the documented teardown path fails or no teardown path is documented.
    unknown: Provisioning documentation is unreadable or does not state whether Azure resources are created, or no readable teardown record identifies the audited commit and documented path.
    remediation: Document and verify azd down or an explicit equivalent outside this read-only audit.
```
