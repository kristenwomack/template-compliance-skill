# Core `azd` Rules

Authority: this repository-owned rule module, as indexed by [compliance-rules.md](compliance-rules.md).

All rules below have `status: active`, `policy_kind: approved`, and `severity: required`.
Source mappings and local interpretation are defined in [policy-sources.md](policy-sources.md).

## Evaluation terms

- **Template root:** the explicitly selected or documented azd working directory, otherwise the repository root. Paths in these rules are relative to that root. An unresolved or ambiguous root is an evidence gap, not proof of a missing file.
- **Applicable azd schema:** the machine-readable schema linked by the [platform reference](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-schema), `https://aka.ms/azure.yaml.json`. Record the schema URL (and resolved URL when available), retrieval time, and version or digest when supplied. The Learn page is documentation, not the schema. If the schema cannot be read and no readable validation record identifies it, schema conformance is `UNABLE TO DETERMINE`.
- **Audited commit:** the target repository commit named in the report. As a local evidence safeguard, execution evidence is fresh only when it identifies that commit. Evidence for another commit or before relevant uncommitted changes does not establish the changed target's result.
- **Scenario-fit evidence:** readable scenario documentation names the provisioned resource types, the infrastructure path is resolved from `azure.yaml` or its default `infra`, and tracked files under that path declare those resource types. An explicit `infra.path` is not required. Framework-specific equivalents are acceptable. Mapping named types to tracked declarations is a local evidence safeguard; it is not upstream wording. If required evidence cannot be read, infrastructure fit is `UNABLE TO DETERMINE`.
- When fresh records disagree, a recorded failure takes precedence over a success. When a required file, external record, or authority cannot be read, use the rule's `unknown` outcome; do not infer its contents.

```yaml
defaults: &defaults
  version: 1
  status: active
  policy_kind: approved
  authority: "template-compliance repository-owned catalog"
  rationale: Tests the cited core requirement using the catalog's explicit local evidence criteria.
  severity: required
  source_revision: "22de60335bd77269a2e952cd0e3e8fab56ed4aa1"
  requirement_kind: upstream-guidance
  local_evidence_policy: "Use policy-sources.md safeguards; insufficient evidence is uncertainty, not an upstream defect."
rules:
  - id: AZD-CORE-001
    <<: *defaults
    version: 2
    references: ["https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#core-azd-functionality", "https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/publishing-guidelines.md#1-build-an-azd-compatible-repository"]
    title: Root azure.yaml
    requirement: azure.yaml MUST exist at the resolved template root.
    applies: Any azd template repository.
    inspect: Explicit target selection or documented working directory and its root file listing.
    pass: A readable root azure.yaml exists.
    fail: A readable root listing proves azure.yaml is absent.
    unknown: The root listing is inaccessible or template root is unresolved.
    remediation: Add azure.yaml at the resolved template root, or clarify the documented working directory.
  - id: AZD-CORE-002
    <<: *defaults
    version: 2
    references: ["https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-schema", "https://aka.ms/azure.yaml.json"]
    source_revision: "live-platform-reference; record inspected schema retrieval time and version or digest when supplied"
    requirement_kind: platform-constraint
    title: azd schema conformance
    requirement: azure.yaml MUST conform to the applicable azd schema defined above.
    applies: Any azd template repository.
    inspect: Template-root azure.yaml, the recorded machine-schema URL and retrieval time, and validator output for that schema.
    pass: Validator output identifies the applicable-schema URL and reports no schema errors for the inspected azure.yaml.
    fail: Validator output identifies the applicable-schema URL and reports one or more schema errors for the inspected azure.yaml.
    unknown: azure.yaml or the applicable schema is unreadable, or validator output tied to both is absent.
    remediation: Correct the reported errors against the applicable azd schema.
  - id: AZD-CORE-003
    <<: *defaults
    version: 2
    references: ["https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#core-azd-functionality"]
    title: Infrastructure assets
    requirement: Infrastructure assets appropriate to the template scenario MUST be committed.
    applies: Any azd template repository.
    inspect: Scenario docs, azure.yaml infra configuration, and tracked infrastructure assets.
    pass: Scenario documentation names the provisioned resource types, the configured or default infrastructure path is resolved, and tracked files under that path declare each named resource type.
    fail: Readable scenario documentation names a provisioned resource type that is absent from the readable tracked files under the resolved infrastructure path, or a required infrastructure file is untracked.
    unknown: Scenario documentation or azure.yaml is unreadable, provisioned resource types are not stated, the configured or default infrastructure path cannot be resolved, or tracked-file state cannot be read.
    remediation: Commit the infrastructure assets required by the documented scenario.
  - id: AZD-CORE-004
    <<: *defaults
    references: ["https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/readme.md#core-azd-template-requirements"]
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
    version: 2
    references: ["https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#core-azd-functionality"]
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
    version: 2
    references: ["https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#core-azd-functionality"]
    title: Verified teardown
    requirement: If the template provisions Azure resources, its documented teardown path MUST be verified using azd down or an explicitly documented equivalent.
    applies: Templates that provision Azure resources.
    inspect: Provisioning docs, teardown docs, and supplied or readable verification evidence.
    pass: Provisioning documentation states that Azure resources are created, names azd down or an explicit equivalent, and evidence identifying the audited commit records successful teardown with that path.
    fail: Evidence proves the documented teardown path fails or no teardown path is documented.
    unknown: Provisioning documentation is unreadable or does not state whether Azure resources are created, or no readable teardown record identifies the audited commit and documented path.
    remediation: Document and verify azd down or an explicit equivalent outside this read-only audit.
```
