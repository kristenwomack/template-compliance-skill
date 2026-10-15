# Policy sources and interpretation

Catalog identity: `azd-publication@4`.

## Versioned guidance baseline

The upstream guidance baseline is `Azure-Samples/azd-template-artifacts` at commit
[`22de60335bd77269a2e952cd0e3e8fab56ed4aa1`](https://github.com/Azure-Samples/azd-template-artifacts/tree/22de60335bd77269a2e952cd0e3e8fab56ed4aa1),
reviewed on 2026-10-05. Each rule links directly to a document and section at this
revision. Upstream changes do not automatically change this catalog: review the
diff, resolve applicability and conflicts, update rule versions and fixtures, and
release a new catalog version.

The upstream collection requirements apply only to `public-awesome-azd`.
Organization readiness uses existing requirements selected by the user as
described in [organization-policy.md](organization-policy.md); the public
guidance baseline does not impose internal governance requirements.

The bundled catalog IDs, report labels, and scope profiles are conventions of
this tool, not standards defined by azd, Copilot, or Vally. Internal requirements
do not need to be converted to this catalog's format.

The catalog remains locally maintained. A PASS means the inspected evidence
satisfies this catalog, not that azd or Awesome AZD maintainers have certified,
accepted, or endorsed the target.

## Source-to-rule mapping

| Rules | Guidance section | Interpretation |
| --- | --- | --- |
| AZD-CORE-001, AZD-CORE-003, AZD-CORE-005, AZD-CORE-006 | [Definition of done: core functionality](https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#core-azd-functionality) | Root configuration, committed scenario-fit infrastructure, successful happy path, and verified teardown. |
| AZD-CORE-002 | [Template configuration reference](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-schema) | Platform schema constraint; the documentation page links the machine-readable schema, but is not itself a schema. |
| AZD-CORE-004 | [Core requirements](https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/readme.md#core-azd-template-requirements) | Code, configuration, and documentation supporting the happy path. |
| AZD-AWESOME-001, AZD-AWESOME-002, AZD-AWESOME-003, AZD-AWESOME-007 | [Repository baseline](https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#awesome-azd-repository-baseline) | Applies only to explicit public collection readiness, not private or standalone projects. |
| AZD-AWESOME-004, AZD-AWESOME-008 | [Review and publication readiness](https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#review-and-publication-readiness) | Reviewable evidence and PSRule validation without warnings. |
| AZD-AWESOME-005, AZD-AWESOME-006 | [Submission guidance](https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/publishing-guidelines.md#4-submit-to-awesome-azd) | Prepared gallery materials and the two recognized submission paths. |

## Explicit local evidence safeguards

These are testing decisions owned by this catalog, not additional upstream mandates:

- Tie execution, security, and validation evidence to the inspected commit.
  Record working-tree state; evidence for HEAD does not verify uncommitted changes.
  If those changes could affect a recorded check, its historical result cannot
  establish PASS for the changed target. Report the evidence gap.
- Map readable scenario documentation to tracked resource declarations when
  establishing infrastructure fit. Resolve omitted `infra.path` to azd's default
  `infra` directory relative to the template root; omission is not a defect.
- Require documented component paths and a scenario-describing repository
  description with at least one matching technology topic to make the source's
  broader usability/discoverability guidance deterministic. These are local
  evidence criteria, not verbatim upstream requirements.
- Require reviewable validator output identifying the actual schema and target.
  Record the schema retrieval time and version or digest when supplied; do not
  invent one. A documentation URL alone does not identify a machine schema.
- A relevant recorded failure takes precedence over success for the same target
  revision. A failing unrelated check does not establish a catalog failure.

If a safeguard prevents a conclusion, label it as a local evidence limitation,
not an upstream rejection or a proven defect.

## Source conflicts and selected interpretations

| Difference | Catalog decision |
| --- | --- |
| The definition of done says repository root; publishing guidance allows a documented working directory. | Treat the documented or explicitly selected working directory as the template root. Resolve it before checking files. Do not fail a monorepo just because its repository root has no `azure.yaml`. If the root cannot be resolved, report uncertainty. |
| The guidance baseline requires `LICENSE.md`, `.github/CODE_OF_CONDUCT.md`, and plural topics `azd-templates` and `ai-azd-templates`; validator defaults or examples may use different spellings or paths. | Apply the pinned guidance profile. Explain differing validator settings separately; do not silently substitute defaults or claim the differences have been settled by collection maintainers. The AI-named topic in this baseline is not evidence that the target must be an AI application. |
| The definition of done requires `Important Security Notice`, but its example `README_H2_TAG` lists only Features, Getting Started, Guidance, and Resources. | Inspect all five headings independently. A run checking only the four example headings cannot establish the full heading rule. |
| Collection automation checks dev containers and workflows by default. | These remain optional. Recommend configuring validation paths and disabling dev-container execution when intentionally omitted; do not create compliance failures for their absence. |

Validator configuration is evidence about which checks ran, not a competing
policy authority. Preserve the selected profile and report unresolved differences
without asserting guaranteed gallery acceptance.

## Guidance without enforcement

Keep profile-applicable SHOULD and MAY guidance separate from compliance findings and
summary counts. Cite its source and condition, and label it **Recommended** or
**Optional**. Do not assign a rule status or change the overall result for it.

Useful recommendations from the pinned
[definition of done](https://github.com/Azure-Samples/azd-template-artifacts/blob/22de60335bd77269a2e952cd0e3e8fab56ed4aa1/docs/development-guidelines/definition-of-done.md#should)
include testing the end-user setup path, covering changed logic, explaining
authentication and secrets handling, and preferring Entra ID or managed identities
where supported. Do not claim those practices were verified by this compliance
audit. Dev containers, CI/CD, screenshots, and demo videos remain optional unless
a specific applicable rule requires a particular submission asset.
