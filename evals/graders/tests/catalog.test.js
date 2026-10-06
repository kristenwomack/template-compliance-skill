import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import YAML from "yaml";

import { REPO_ROOT } from "../../parity/legacy-parity.js";
import { ALL_RULES } from "./report-fixtures.js";

const REFERENCES = path.join(REPO_ROOT, "skills", "template-compliance", "references");
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

  it("preserves all fourteen rule IDs exactly once", () => {
    assert.deepEqual(rules.map((rule) => rule.id).sort(), [...ALL_RULES].sort());
  });

  describe("profile policy fixtures", () => {
    function context(name) {
      return YAML.parse(fs.readFileSync(path.join(REPO_ROOT, "evals", "fixtures", name, "context.yaml"), "utf8"));
    }

    it("keeps the packaged organization example unapproved and non-enforcing", () => {
      const text = fs.readFileSync(path.join(REFERENCES, "organization-policy.md"), "utf8");
      const example = YAML.parse(text.match(/```yaml\r?\n([\s\S]*?)```/)[1]);
      assert.equal(example.approval.status, "unapproved");
      assert.ok(example.rules.every((rule) => rule.status !== "active" && rule.policy_kind !== "approved"));
    });

    it("supplies complete namespaced rules and approval evidence for the selected policy", () => {
      const evidence = context("organization-policy-selected");
      const policy = evidence.policy_document;
      assert.equal(policy.schema_version, 1);
      assert.equal(policy.profile, "organization-catalog");
      assert.equal(policy.approval.status, "approved");
      assert.equal(evidence.approval_record.reference, policy.approval.reference);
      assert.equal(evidence.approval_record.policy_id, policy.id);
      assert.equal(evidence.approval_record.version, policy.version);
      assert.equal(new Set(policy.rules.map((rule) => rule.id)).size, policy.rules.length);
      for (const rule of policy.rules) {
        assert.match(rule.id, new RegExp(`^AZD-ORG-${policy.namespace}-\\d{3}$`));
        for (const field of [
          "title", "version", "status", "policy_kind", "authority", "requirement", "rationale",
          "applies", "inspect", "pass", "fail", "unknown", "severity", "remediation",
          "references", "source_revision", "requirement_kind", "local_evidence_policy",
        ]) assert.ok(rule[field], `${rule.id} missing ${field}`);
        assert.equal(rule.requirement_kind, "organization-policy");
      }
      assert.equal(policy.rules.filter((rule) => rule.status === "active" && rule.policy_kind === "approved").length, 3);
      assert.equal(evidence.internal_metadata.environment_class_access, "denied");
    });

    it("keeps missing, denied, invalid, and empty policy cases distinct", () => {
      assert.equal(context("organization-policy-missing").policy_selection, "none");
      assert.equal(context("organization-policy-inaccessible").policy_access, "denied");
      assert.equal(context("organization-policy-invalid").policy_document.approval.status, "unapproved");
      assert.deepEqual(context("organization-policy-empty").policy_document.rules, []);
      const mismatch = context("organization-approval-mismatch");
      assert.equal(mismatch.policy_document.approval.status, "approved");
      assert.notEqual(mismatch.policy_document.version, mismatch.approval_record.version);
    });

    it("contains no submission evidence in the public preparation case", () => {
      const evidence = YAML.parse(fs.readFileSync(path.join(REPO_ROOT, "evals", "fixtures", "public-preparation", "public-evidence.yaml"), "utf8"));
      assert.equal(evidence.evidence.submission, undefined);
      assert.equal(context("public-preparation").public_stage, "preparation");
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
