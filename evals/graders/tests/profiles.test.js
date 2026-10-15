import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseReport } from "../report-parser.js";
import { resolveConfig, PublicationReportGrader } from "../publication-report.js";
import { AWESOME_RULES, CORE_RULES, report, uniform } from "./report-fixtures.js";

const grader = new PublicationReportGrader();
const core = uniform(CORE_RULES, "PASS");
// Test-local headings from an ordinary document, not an organization ID standard.
const policyPattern = "AZD-[A-Z]+-\\d{3}|Ownership|Support|Production review";

async function grade(options, config = {}) {
  return grader.grade({ trajectory: { output: report(options) }, config: { rule_id_pattern: policyPattern, ...config } });
}

describe("profile report parsing", () => {
  it("matches complete normalized organization headings, not prefixes", () => {
    for (const heading of ["Support", "**Support**", "`Support`", "Support ###"]) {
      const parsed = parseReport(`### ${heading}\nStatus: PASS`, { ruleIdPattern: policyPattern });
      assert.deepEqual(parsed.findings, { Support: "PASS" }, heading);
    }
    for (const heading of ["Supportability notes", "Support notes", "Production review checklist"]) {
      const parsed = parseReport(`### ${heading}\nStatus: PASS`, { ruleIdPattern: policyPattern });
      assert.deepEqual(parsed.findings, {}, heading);
    }
    const bundled = parseReport("### AZD-CORE-001 — azure.yaml at root\nStatus: PASS", { ruleIdPattern: policyPattern });
    assert.deepEqual(bundled.findings, { "AZD-CORE-001": "PASS" });
  });
  it("parses existing document headings and readiness without counting layer labels", () => {
    const parsed = parseReport(report({
      overall: "FAIL",
      profile: "organization-catalog",
      readiness: { core: "PASS", destination: "FAIL" },
      statuses: { ...core, Ownership: "FAIL" },
    }), { ruleIdPattern: policyPattern });
    assert.equal(parsed.findings.Ownership, "FAIL");
    assert.deepEqual(parsed.readiness, { profile: "organization-catalog", stage: null, core: "PASS", destination: "FAIL" });
    assert.equal(parsed.summary.applicable, 7);
    assert.equal(parsed.malformed.length, 0);
  });

  it("rejects duplicate or malformed readiness labels", () => {
    const parsed = parseReport(report({
      profile: "core-only",
      readiness: { core: "PASS", destination: "NOT ASSESSED" },
      extraLines: ["- **Core readiness:** FAIL", "- **Public stage:** published"],
    }));
    assert.deepEqual(parsed.malformed.map((entry) => entry.reason), ["readiness-field-duplicate", "readiness-field-invalid"]);
  });

  it("treats readiness-only output as a report in non-trigger checks", async () => {
    const result = await grader.grade({
      trajectory: { output: "**Destination readiness:** PASS" },
      config: { expect_report: false },
    });
    assert.equal(result.passed, false);
  });
});

describe("profile config validation", () => {
  it("rejects invalid profiles, verdicts, extra keys, or private public-stage settings", () => {
    for (const config of [
      { destination_profile: "private" },
      { readiness: { core: "PASS", destination: "READY" } },
      { readiness: { core: "PASS", destination: "PASS", unknown: true } },
      { destination_profile: "organization-catalog", public_stage: "submission" },
      { destination_profile: "core-only", readiness: { core: "PASS", destination: "PASS" } },
      { destination_profile: "organization-catalog", readiness: { core: "PASS", destination: "NOT ASSESSED" } },
    ]) assert.throws(() => resolveConfig(config), /config\./);
  });
});

describe("readiness layer checks", () => {
  it("rejects legacy-shaped reports universally, including optional reports without config labels", async () => {
    for (const config of [{}, { expect_report: "optional" }, { findings: core }]) {
      const result = await grade({ overall: "PASS", statuses: core }, config);
      assert.equal(result.passed, false);
      assert.ok(result.details.some((detail) => detail.name === "readiness-layers" && !detail.passed));
    }
    for (const omit of ["profile", "readiness"]) {
      const options = {
        overall: "PASS", statuses: core, profile: "core-only",
        readiness: { core: "PASS", destination: "NOT ASSESSED" },
      };
      delete options[omit];
      assert.equal((await grade(options)).passed, false);
    }
  });
  it("allows passing core with unresolved organization policy, but blocks overall PASS", async () => {
    const options = {
      overall: "UNABLE TO DETERMINE", statuses: core, profile: "organization-catalog",
      readiness: { core: "PASS", destination: "UNABLE TO DETERMINE" },
    };
    assert.equal((await grade(options)).passed, true);
    const result = await grade({ ...options, overall: "PASS" });
    assert.equal(result.passed, false);
    assert.ok(result.details.some((detail) => detail.name === "overall-result-consistent" && !detail.passed));
  });

  it("keeps a known core failure dominant over an organization-policy gap", async () => {
    const result = await grade({
      overall: "FAIL", statuses: { ...core, "AZD-CORE-001": "FAIL" }, profile: "organization-catalog",
      readiness: { core: "FAIL", destination: "UNABLE TO DETERMINE" },
    });
    assert.equal(result.passed, true, result.evidence);
  });

  it("does not establish readiness from an empty organization policy", async () => {
    const result = await grade({
      overall: "UNABLE TO DETERMINE", statuses: core, profile: "organization-catalog",
      readiness: { core: "PASS", destination: "NO ACTIVE APPLICABLE RULES" },
    });
    assert.equal(result.passed, true, result.evidence);
  });

  it("accepts core-only and unresolved reports with destination NOT ASSESSED", async () => {
    for (const profile of ["core-only", "unresolved"]) {
      const result = await grade({
        overall: "PASS", statuses: core, profile,
        readiness: { core: "PASS", destination: "NOT ASSESSED" },
      });
      assert.equal(result.passed, true, result.evidence);
    }
  });

  it("rejects public findings leaking into private or unresolved profiles", async () => {
    for (const profile of ["core-only", "organization-catalog", "unresolved"]) {
      const result = await grade({
        overall: "FAIL", statuses: { ...core, "AZD-AWESOME-002": "FAIL" }, profile,
        readiness: { core: "PASS", destination: profile === "organization-catalog" ? "FAIL" : "NOT ASSESSED" },
      });
      assert.equal(result.passed, false);
    }
  });

  it("grades organization findings and verifies expected layer values", async () => {
    const result = await grade({
      overall: "FAIL", statuses: { ...core, Support: "FAIL" }, profile: "organization-catalog",
      readiness: { core: "PASS", destination: "FAIL" },
    }, {
      destination_profile: "organization-catalog",
      readiness: { core: "PASS", destination: "FAIL" },
      findings: { ...core, Support: "FAIL" },
    });
    assert.equal(result.passed, true, result.evidence);
  });

  it("allows organization readiness PASS when core and selected organization findings pass", async () => {
    const result = await grade({
      overall: "PASS", statuses: { ...core, Ownership: "PASS" }, profile: "organization-catalog",
      readiness: { core: "PASS", destination: "PASS" },
    });
    assert.equal(result.passed, true, result.evidence);
  });

  it("rejects a wrong profile, missing labels, and organization findings in public reports", async () => {
    assert.equal((await grade({
      overall: "PASS", statuses: core, profile: "core-only",
      readiness: { core: "PASS", destination: "NOT ASSESSED" },
    }, { destination_profile: "organization-catalog" })).passed, false);
    assert.equal((await grade({ overall: "PASS", statuses: core }, { destination_profile: "core-only" })).passed, false);
    assert.equal((await grade({
      overall: "PASS", statuses: { ...core, Ownership: "PASS" }, profile: "public-awesome-azd",
      stage: "preparation", readiness: { core: "PASS", destination: "PASS" },
    })).passed, false);
  });

  it("does not require a submission record during public preparation", async () => {
    const preparation = uniform(AWESOME_RULES.filter((id) => id !== "AZD-AWESOME-006"), "PASS");
    const options = {
      overall: "PASS", statuses: { ...core, ...preparation }, profile: "public-awesome-azd",
      stage: "preparation", readiness: { core: "PASS", destination: "PASS" },
    };
    assert.equal((await grade(options)).passed, true);
    assert.equal((await grade({ ...options, statuses: { ...options.statuses, "AZD-AWESOME-006": "UNABLE TO DETERMINE" } })).passed, false);
    assert.equal((await grade({ ...options, stage: "submission" })).passed, false);
    assert.equal((await grade({
      ...options, stage: "submission", statuses: { ...options.statuses, "AZD-AWESOME-006": "PASS" },
    })).passed, true);
  });

  it("rejects missing mandatory rules and fabricated bundled rule IDs in layered reports", async () => {
    const options = {
      overall: "PASS", statuses: core, profile: "core-only",
      readiness: { core: "PASS", destination: "NOT ASSESSED" },
    };
    const incomplete = { ...core };
    delete incomplete["AZD-CORE-002"];
    assert.equal((await grade({ ...options, statuses: incomplete })).passed, false);
    assert.equal((await grade({ ...options, statuses: { ...core, "AZD-CORE-999": "PASS" } })).passed, false);

    const publicOptions = {
      ...options, profile: "public-awesome-azd", stage: "preparation",
      readiness: { core: "PASS", destination: "PASS" },
    };
    assert.equal((await grade({ ...publicOptions, statuses: { ...core, "AZD-AWESOME-001": "PASS" } })).passed, false);
    const publicRules = uniform(AWESOME_RULES.filter((id) => id !== "AZD-AWESOME-006"), "PASS");
    assert.equal((await grade({ ...publicOptions, statuses: { ...core, ...publicRules, "AZD-AWESOME-999": "PASS" } })).passed, false);
  });

  it("keeps unknown organization applicability as a finding rather than claiming readiness", async () => {
    const options = {
      overall: "UNABLE TO DETERMINE",
      statuses: { ...core, "Production review": "UNABLE TO DETERMINE" },
      profile: "organization-catalog",
      readiness: { core: "PASS", destination: "UNABLE TO DETERMINE" },
    };
    assert.equal((await grade(options)).passed, true);
    assert.equal((await grade({ ...options, readiness: { core: "PASS", destination: "PASS" } })).passed, false);
  });
});
