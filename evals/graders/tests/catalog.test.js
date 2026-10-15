import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import YAML from "yaml";

import { REPO_ROOT } from "../../parity/legacy-parity.js";
import { ALL_RULES } from "./report-fixtures.js";
import { checkPublication, REQUIRED_HEADINGS, GOVERNANCE_FILES } from "../../../skills/azd/scripts/check-publication.mjs";

const REFERENCES = path.join(REPO_ROOT, "skills", "azd", "references");
const REVISION = "22de60335bd77269a2e952cd0e3e8fab56ed4aa1";
const MODULES = ["core-azd-rules.md", "awesome-azd-publication-rules.md", "awesome-azd-submission-rules.md"];

function loadRules() {
  return MODULES.flatMap((name) => {
    const text = fs.readFileSync(path.join(REFERENCES, name), "utf8");
    const block = text.match(/```yaml\r?\n([\s\S]*?)```/);
    assert.ok(block, `${name} has no YAML rule block`);
    return YAML.parse(block[1], { merge: true }).rules;
  });
}

describe("catalog provenance", () => {
  const rules = loadRules();

  it("generated views preserve the canonical rule objects exactly", () => {
    const catalog = JSON.parse(fs.readFileSync(path.join(REFERENCES, "..", "policy", "publication-catalog.json"), "utf8"));
    assert.deepEqual(rules, catalog.rules);
    assert.equal(new Set(catalog.rules.map((rule) => rule.id)).size, 14);
    for (const rule of catalog.rules) {
      assert.equal(rule.layer, rule.id.startsWith("AZD-CORE-") ? "core" : "destination");
      assert.deepEqual(rule.stages, rule.id === "AZD-AWESOME-006" ? ["submission"] : ["preparation", "submission"]);
    }
  });

  it("preserves all fourteen rule IDs exactly once", () => {
    assert.deepEqual(rules.map((rule) => rule.id).sort(), [...ALL_RULES].sort());
  });

  it("keeps deterministic checks synchronized with catalog requirements", async () => {
    const terms = fs.readFileSync(path.join(REFERENCES, "awesome-azd-rules.md"), "utf8");
    const governance = rules.find((rule) => rule.id === "AZD-AWESOME-002");
    assert.deepEqual([...terms.matchAll(/`## ([^`]+)`/g)].map((match) => match[1]), REQUIRED_HEADINGS);
    assert.deepEqual(governance.requirement.match(/(?:\.github\/)?[A-Z_]+\.md/g), GOVERNANCE_FILES);
    const root = path.join(REPO_ROOT, "evals", "fixtures", "private-core-only", "project");
    for (const stage of ["preparation", "submission"]) {
      const result = await checkPublication({ root, profile: "public-awesome-azd", stage });
      const selected = [...result.findings.map((finding) => finding.id), ...result.remaining_rules.map((rule) => rule.id)].sort();
      const expected = rules.map((rule) => rule.id).filter((id) => stage === "submission" || id !== "AZD-AWESOME-006").sort();
      assert.deepEqual(selected, expected);
      for (const rule of result.remaining_rules) {
        const canonical = rules.find((entry) => entry.id === rule.id);
        for (const [key, value] of Object.entries(rule)) assert.deepEqual(value, canonical[key], `${rule.id}.${key}`);
      }
    }
  });

  it("runtime payload is self-contained and smaller than the previous mandatory reference reads", async () => {
    const root = path.join(REPO_ROOT, "evals", "fixtures", "private-core-only", "project");
    for (const profile of ["core-only", "public-awesome-azd"]) {
      const result = await checkPublication({ root, profile });
      assert.equal(result.format_version, 2);
      assert.equal(result.policy_baseline, REVISION);
      assert.ok(result.safeguards.some((text) => text.includes("uncommitted")));
      assert.ok(result.safeguards.some((text) => text.includes("infra.path")));
      for (const rule of result.remaining_rules) {
        for (const key of ["id", "title", "layer", "requirement", "applies", "inspect", "pass", "fail", "unknown", "remediation", "requirement_kind", "source_revision", "references"]) {
          assert.ok(rule[key], `${rule.id} missing ${key}`);
        }
      }
      for (const finding of result.findings) {
        assert.ok(finding.policy_basis.references.length);
        assert.ok(finding.policy_basis.requirement);
        if (finding.status === "FAIL") assert.ok(finding.remediation);
        if (finding.status === "UNABLE TO DETERMINE" || finding.id === "AZD-AWESOME-007") assert.ok(finding.reconciliation_criteria);
      }
      const files = ["core-azd-rules.md", "policy-sources.md", ...(profile === "public-awesome-azd" ? ["awesome-azd-rules.md", ...MODULES.slice(1)] : [])];
      const bytes = files.reduce((total, name) => total + fs.readFileSync(path.join(REFERENCES, name)).length, 0);
      assert.ok(Buffer.byteLength(JSON.stringify(result, null, 2)) < bytes, `Payload for ${profile} did not reduce reference bytes`);
    }
  });

  describe("profile policy fixtures", () => {
    function fixture(name, file) {
      return fs.readFileSync(path.join(REPO_ROOT, "evals", "fixtures", name, file), "utf8");
    }

    it("does not prescribe a policy serialization or namespace", () => {
      const text = fs.readFileSync(path.join(REFERENCES, "organization-policy.md"), "utf8");
      assert.ok(!text.includes("```yaml"));
      assert.match(text, /does not define an organization-policy file format/);
      assert.match(text, /existing rule ID or section heading/);
    });

    it("supplies actual azd project files without claimed schema or deployment results", () => {
      for (const name of [
        "private-core-only", "organization-policy-selected", "organization-policy-missing",
        "organization-policy-inaccessible", "organization-policy-empty",
      ]) {
        const config = YAML.parse(fixture(name, "project/azure.yaml"));
        const readme = fixture(name, "project/README.md");
        const bicep = fixture(name, "project/infra/main.bicep");
        assert.equal(config.infra.provider, "bicep");
        assert.equal(config.infra.path, undefined);
        assert.match(readme, /Microsoft\.Storage\/storageAccounts/);
        assert.match(readme, /azd up/);
        assert.match(readme, /azd down/);
        assert.match(bicep, /Microsoft\.Storage\/storageAccounts@/);
        assert.ok(!fs.existsSync(path.join(REPO_ROOT, "evals", "fixtures", name, "context.yaml")));
      }
    });

    it("uses ordinary document headings for selected organization requirements", () => {
      const policy = fixture("organization-policy-selected", "internal-requirements.md");
      assert.match(policy, /^## Ownership$/m);
      assert.match(policy, /^## Support$/m);
      assert.match(policy, /^## Production review$/m);
      assert.match(fixture("organization-policy-selected", "project/README.md"), /Owner: Platform Engineering/);
      assert.ok(!fixture("organization-policy-selected", "project/README.md").includes("Support:"));
      assert.ok(!fixture("organization-policy-empty", "internal-requirements.md").includes("must"));
    });

    it("contains no submission evidence in the public preparation case", () => {
      const evidence = YAML.parse(fs.readFileSync(path.join(REPO_ROOT, "evals", "fixtures", "public-preparation", "public-evidence.yaml"), "utf8"));
      assert.equal(evidence.evidence.submission, undefined);
      assert.match(evidence.evidence_scope, /Synthetic/);
    });
  });

  it("gives each rule an explicit source classification and local evidence policy", () => {
    for (const rule of rules) {
      assert.ok(["upstream-guidance", "platform-constraint"].includes(rule.requirement_kind), rule.id);
      assert.ok(rule.local_evidence_policy?.includes("policy-sources.md"), rule.id);
      assert.ok(rule.references?.length > 0, `${rule.id} has no source`);
      assert.ok(Number.isInteger(rule.version) && rule.version >= 1, rule.id);
      if (rule.requirement_kind === "upstream-guidance") {
        assert.equal(rule.source_revision, REVISION, rule.id);
        assert.ok(
          rule.references.every((url) => url.startsWith(`https://github.com/Azure-Samples/azd-template-artifacts/blob/${REVISION}/`) && url.includes("#")),
          `${rule.id} must cite pinned upstream sections`,
        );
      } else {
        assert.equal(rule.id, "AZD-CORE-002");
        assert.ok(rule.references.includes("https://aka.ms/azure.yaml.json"));
        assert.ok(rule.source_revision.startsWith("live-platform-reference"));
      }
    }
  });

  it("uses machine-schema URLs in the existing schema evidence fixtures", () => {
    for (const name of ["compliant-template", "all-rules-pass", "all-rules-fail"]) {
      const evidence = YAML.parse(fs.readFileSync(path.join(REPO_ROOT, "evals", "fixtures", name, "evidence.yaml"), "utf8"));
      const task = YAML.parse(fs.readFileSync(path.join(REPO_ROOT, "evals", "tasks", `${name}.yaml`), "utf8"));
      assert.equal(evidence.schema_validation.schema_url, "https://aka.ms/azure.yaml.json", name);
      assert.deepEqual(evidence.schema_validation, task.fixture.schema_validation, name);
    }
  });

  it("preserves configuration-dependent uncertainty in the negative fixture", () => {
    const task = YAML.parse(fs.readFileSync(path.join(REPO_ROOT, "evals", "tasks", "all-rules-fail.yaml"), "utf8"));
    assert.deepEqual(task.fixture.repository.root_files, []);
    assert.equal(task.expected.finding_status["AZD-CORE-001"], "FAIL");
    assert.equal(task.expected.finding_status["AZD-CORE-002"], "UNABLE TO DETERMINE");
    assert.equal(task.expected.finding_status["AZD-CORE-003"], "UNABLE TO DETERMINE");
  });

  it("keeps the policy regression targeted at defaults and incomplete validator coverage", () => {
    const evidence = YAML.parse(fs.readFileSync(path.join(REPO_ROOT, "evals", "fixtures", "policy-interpretation", "evidence.yaml"), "utf8"));
    const config = YAML.parse(evidence.repository.azure_yaml.content);
    assert.equal(evidence.repository.template_root, "examples/web");
    assert.equal(config.infra, undefined);
    assert.ok(evidence.repository.template_root_files.includes("infra/main.bicep"));
    assert.ok(!evidence.repository.root_files.includes("azure.yaml"));
    assert.ok(!evidence.repository.readme.content.includes("## Important Security Notice"));
    assert.equal(evidence.evidence.validation.checked_headings.length, 4);
  });
});
