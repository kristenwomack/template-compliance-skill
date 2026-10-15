# Prepare or review publication

This is a read-only, stricter **template publication assessment**, separate from
project diagnostics. Even `core-only` is a template assessment, not universal
requirements for existing-code azd projects. Preparation identifies gaps; it
does not edit files, deploy, destroy resources, submit, or establish acceptance.

1. Resolve the selected template root, repository root, revision/working-tree
   state, and requested destination. Select profile/stage using
   [policy-profiles.md](policy-profiles.md). Visibility never selects a
   destination. If unresolved, ask or assess core only with destination
   NOT ASSESSED. Ordinary project checks go to [check.md](check.md).
2. Use the bundled [static checker](static-checks.md):

   ```text
   node "<installed-skill>/scripts/check-publication.mjs" --root "<template>" --profile core-only
   node "<installed-skill>/scripts/check-publication.mjs" --root "<template>" --repository-root "<repository>" --profile public-awesome-azd --stage preparation
   ```

   Only this installed trusted script may run, never target scripts or azd
   commands. Respect denied paths. Missing Node.js/local evidence is a
   limitation, not a failed rule; use selected generated rule views manually.
3. Retain static findings and assess `remaining_rules` with their included
   criteria, safeguards, and citations. The canonical policy is
   [publication-catalog.json](../policy/publication-catalog.json).
   Do not load full modules/history routinely. For synthetic evidence/manual
   fallback use only selected [rule views](compliance-rules.md).
   [Provenance](policy-sources.md) is on demand.
4. For organization-catalog, inspect only explicitly selected
   [existing requirements](organization-policy.md), preserving IDs/headings.
   Do not invent a policy format or import public requirements. Missing or
   ambiguous policy blocks organization readiness without a fabricated finding.
5. Assign PASS only for direct satisfying evidence, FAIL only for contradictory
   or proven-missing evidence, otherwise UNABLE TO DETERMINE. Unknown
   applicability is a finding, not an exclusion. Cite paths/lines or precise
   gaps. Reconcile fresh supplied records using the criteria; never execute
   code/deploy/teardown to obtain evidence. Recommend remediation only.
6. Complete the [report contract](report-format.md): one finding per applicable
   rule, matching counts, separate core/destination readiness, source revisions,
   limitations, and no-modification statement. Static output is partial, not a
   readiness verdict. SHOULD/MAY guidance is non-enforcing; an empty applicable
   rule set is not compliance. Readiness is not collection acceptance.

If the user requests publication fixes, propose scoped local changes and obtain
approval before routing to [build.md](build.md). Submission is a separate,
explicitly authorized action, never part of review or implied by “ready”.
