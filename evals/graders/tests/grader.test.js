// Behavioural tests for the `template-compliance-report` Vally grader.
//
// These drive the grader through its real `grade()` entry point with a minimal
// trajectory, and register it through Vally's real plugin loader so the plugin
// contract itself is covered.

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { createGraderRegistry, loadGraderPlugin } from "@microsoft/vally";

import {
  TemplateComplianceReportGrader,
  registerGraders,
  resolveConfig,
} from "../template-compliance-report.js";

import { ALL_RULES, CORE_RULES, report, uniform } from "./report-fixtures.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN = path.resolve(HERE, "..", "template-compliance-report.js");

const grader = new TemplateComplianceReportGrader();

async function grade(output, config) {
  return grader.grade({ trajectory: { output }, config });
}

/** Names of the sub-checks that failed, for compact assertions. */
function failedChecks(result) {
  return result.details.filter((d) => !d.passed).map((d) => d.name);
}

describe("plugin contract", () => {
  it("registers through Vally's grader plugin loader", async () => {
    const registry = createGraderRegistry();
    await loadGraderPlugin(PLUGIN, registry, { cwd: HERE });
    const registered = registry.get("template-compliance-report");
    assert.ok(registered, "grader was not registered");
    assert.equal(registered.metadata.determinism, "static");
    assert.equal(registered.metadata.costProfile, "free");
    assert.equal(registered.metadata.behavior.requiresLlmClient ?? false, false);
    assert.equal(registered.metadata.behavior.requiresWorkspace ?? false, false);
  });

  it("exposes registerGraders directly", () => {
    const registered = [];
    registerGraders({ register: (g) => registered.push(g) });
    assert.equal(registered.length, 1);
    assert.equal(registered[0].metadata.name, "template-compliance-report");
  });

  it("derives a pure, config-specific default name", () => {
    assert.equal(
      grader.defaultName({ overall_result: "PASS", findings: uniform(CORE_RULES, "PASS") }),
      "template-compliance-report PASS / 6 rules",
    );
    assert.equal(grader.defaultName({ expect_report: false }), "template-compliance-report absent");
    assert.equal(grader.assertsAbsence({ expect_report: false }), true);
    assert.equal(grader.assertsAbsence({ overall_result: "PASS" }), false);
  });
});

describe("config validation", () => {
  it("rejects an unknown key", () => {
    assert.throws(() => resolveConfig({ findigns: {} }), /unknown config key/);
  });

  it("rejects an invalid expected status", () => {
    assert.throws(() => resolveConfig({ findings: { "AZD-CORE-001": "PASSED" } }), /must be one of/);
  });

  it("rejects an invalid overall result", () => {
    assert.throws(() => resolveConfig({ overall_result: "COMPLIANT" }), /must be one of/);
  });

  it("defaults exhaustive, summary, and integrity checks on when findings are declared", () => {
    const resolved = resolveConfig({ overall_result: "PASS", findings: uniform(CORE_RULES, "PASS") });
    assert.equal(resolved.exhaustive, true);
    assert.equal(resolved.requireSummaryCounts, true);
    assert.equal(resolved.requireIntegrityStatement, true);
  });

  it("leaves the extra checks off for a partial expectation", () => {
    const resolved = resolveConfig({ findings: { "AZD-AWESOME-002": "PASS" }, exhaustive: false });
    assert.equal(resolved.exhaustive, false);
    assert.equal(resolved.requireSummaryCounts, false);
  });
});

describe("PASS stimulus", () => {
  const config = { overall_result: "PASS", findings: uniform(CORE_RULES, "PASS") };

  it("passes on a contract-shaped PASS report", async () => {
    const result = await grade(report({ overall: "PASS", statuses: uniform(CORE_RULES, "PASS") }), config);
    assert.equal(result.passed, true, result.evidence);
    assert.equal(result.score, 1);
    assert.equal(result.graderType, "template-compliance-report");
    assert.equal(failedChecks(result).length, 0);
  });

  it("passes on the same report rendered as a table", async () => {
    const result = await grade(
      report({ overall: "PASS", statuses: uniform(CORE_RULES, "PASS"), style: "table" }),
      config,
    );
    assert.equal(result.passed, true, result.evidence);
  });

  it("fails when the overall result is wrong", async () => {
    const result = await grade(report({ overall: "FAIL", statuses: uniform(CORE_RULES, "PASS") }), config);
    assert.equal(result.passed, false);
    assert.deepEqual(failedChecks(result), ["overall-result", "overall-result-consistent"]);
    assert.match(result.evidence, /Expected overall result PASS, found FAIL/);
  });

  it("fails when the integrity statement is missing", async () => {
    const result = await grade(
      report({ overall: "PASS", statuses: uniform(CORE_RULES, "PASS"), integrity: false }),
      config,
    );
    assert.equal(result.passed, false);
    assert.deepEqual(failedChecks(result), ["integrity-statement"]);
  });
});

describe("FAIL stimulus", () => {
  const statuses = {
    "AZD-CORE-001": "FAIL",
    "AZD-CORE-002": "UNABLE TO DETERMINE",
    "AZD-CORE-003": "UNABLE TO DETERMINE",
    "AZD-CORE-004": "UNABLE TO DETERMINE",
    "AZD-CORE-005": "UNABLE TO DETERMINE",
    "AZD-CORE-006": "UNABLE TO DETERMINE",
  };
  const config = { overall_result: "FAIL", findings: statuses };

  it("passes on the expected mixed report", async () => {
    const result = await grade(report({ overall: "FAIL", statuses }), config);
    assert.equal(result.passed, true, result.evidence);
  });

  it("fails when a rule that should be indeterminate is reported as FAIL", async () => {
    const drifted = { ...statuses, "AZD-CORE-004": "FAIL" };
    const result = await grade(report({ overall: "FAIL", statuses: drifted }), config);
    assert.equal(result.passed, false);
    assert.ok(failedChecks(result).includes("finding-statuses"));
    assert.match(result.evidence, /AZD-CORE-004: expected UNABLE TO DETERMINE, found FAIL/);
  });
});

describe("UNABLE TO DETERMINE stimulus", () => {
  const config = {
    overall_result: "UNABLE TO DETERMINE",
    findings: uniform(ALL_RULES, "UNABLE TO DETERMINE"),
  };

  it("passes on an all-indeterminate 14-rule report", async () => {
    const result = await grade(
      report({ overall: "UNABLE TO DETERMINE", statuses: uniform(ALL_RULES, "UNABLE TO DETERMINE") }),
      config,
    );
    assert.equal(result.passed, true, result.evidence);
  });

  it("fails when uncertainty is turned into a failure", async () => {
    const statuses = uniform(ALL_RULES, "UNABLE TO DETERMINE");
    statuses["AZD-AWESOME-008"] = "FAIL";
    const result = await grade(report({ overall: "FAIL", statuses }), config);
    assert.equal(result.passed, false);
    assert.ok(failedChecks(result).includes("overall-result"));
    assert.ok(failedChecks(result).includes("finding-statuses"));
  });
});

describe("missing findings", () => {
  it("fails when an expected rule is not reported at all", async () => {
    const statuses = uniform(CORE_RULES, "PASS");
    delete statuses["AZD-CORE-006"];
    const result = await grade(report({ overall: "PASS", statuses }), {
      overall_result: "PASS",
      findings: uniform(CORE_RULES, "PASS"),
    });
    assert.equal(result.passed, false);
    assert.ok(failedChecks(result).includes("finding-statuses"));
    assert.match(result.evidence, /Missing findings: AZD-CORE-006/);
  });
});

describe("unexpected findings", () => {
  it("fails when an out-of-scope rule set appears", async () => {
    const statuses = { ...uniform(CORE_RULES, "PASS"), "AZD-AWESOME-001": "PASS" };
    const result = await grade(report({ overall: "PASS", statuses }), {
      overall_result: "PASS",
      findings: uniform(CORE_RULES, "PASS"),
    });
    assert.equal(result.passed, false);
    assert.ok(failedChecks(result).includes("no-unexpected-findings"));
    assert.match(result.evidence, /Unexpected findings: AZD-AWESOME-001/);
  });

  it("allows extra rules when the expectation is explicitly partial", async () => {
    const statuses = {
      "AZD-AWESOME-002": "PASS",
      "AZD-AWESOME-004": "UNABLE TO DETERMINE",
      "AZD-AWESOME-007": "UNABLE TO DETERMINE",
      "AZD-AWESOME-008": "UNABLE TO DETERMINE",
      "AZD-AWESOME-001": "PASS",
    };
    const result = await grade(report({ overall: "UNABLE TO DETERMINE", statuses, summaryStyle: "none" }), {
      findings: {
        "AZD-AWESOME-002": "PASS",
        "AZD-AWESOME-004": "UNABLE TO DETERMINE",
        "AZD-AWESOME-007": "UNABLE TO DETERMINE",
        "AZD-AWESOME-008": "UNABLE TO DETERMINE",
      },
      exhaustive: false,
    });
    assert.equal(result.passed, true, result.evidence);
  });

  it("rejects an overall result inconsistent with partial findings", async () => {
    const statuses = {
      "AZD-AWESOME-002": "PASS",
      "AZD-AWESOME-004": "UNABLE TO DETERMINE",
      "AZD-AWESOME-007": "UNABLE TO DETERMINE",
    };
    const result = await grade(report({ overall: "PASS", statuses, summaryStyle: "none" }), {
      findings: { "AZD-AWESOME-002": "PASS" },
      exhaustive: false,
    });
    assert.equal(result.passed, false);
    assert.deepEqual(failedChecks(result), ["overall-result-consistent"]);
    assert.match(result.evidence, /must be UNABLE TO DETERMINE/);
  });

  it("fails when a forbidden rule set is reported", async () => {
    const statuses = { ...uniform(CORE_RULES, "PASS"), "AZD-AWESOME-003": "PASS" };
    const result = await grade(report({ overall: "PASS", statuses, summaryStyle: "none" }), {
      expect_report: "optional",
      forbidden_rules: ["AZD-AWESOME-003"],
      forbidden_overall_results: ["PASS"],
    });
    assert.equal(result.passed, false);
    assert.deepEqual(failedChecks(result), ["forbidden-overall-result", "forbidden-rules-absent"]);
  });

  it("fails when a limited-scope answer still claims overall compliance", async () => {
    const result = await grade(report({ overall: "PASS", statuses: uniform(CORE_RULES, "PASS") }), {
      expect_report: "optional",
      forbidden_rules: ["AZD-AWESOME-001"],
      forbidden_overall_results: ["PASS"],
    });
    assert.equal(result.passed, false);
    assert.deepEqual(failedChecks(result), ["forbidden-overall-result"]);
  });

  it("allows an optional report to be replaced by a scoping question", async () => {
    const result = await grade(
      "Before I audit this, should Awesome AZD publication readiness be in scope, or core azd rules only?",
      {
        expect_report: "optional",
        forbidden_rules: ["AZD-AWESOME-001", "AZD-AWESOME-002"],
        forbidden_overall_results: ["PASS"],
      },
    );
    assert.equal(result.passed, true, result.evidence);
  });

  it("rejects an unsupported expect_report value", () => {
    assert.throws(() => resolveConfig({ expect_report: "maybe" }), /expect_report must be/);
  });
});

describe("duplicate findings", () => {
  it("fails when a rule is reported twice", async () => {
    const duplicated = report({ overall: "PASS", statuses: uniform(CORE_RULES, "PASS") }).replace(
      "## Limitations and integrity",
      "### AZD-CORE-001 \u2014 catalog requirement\n\n- **Status:** PASS\n\n## Limitations and integrity",
    );
    const result = await grade(duplicated, {
      overall_result: "PASS",
      findings: uniform(CORE_RULES, "PASS"),
    });
    assert.equal(result.passed, false);
    assert.ok(failedChecks(result).includes("no-duplicate-findings"));
    assert.match(result.evidence, /AZD-CORE-001 \(repeated-finding/);
  });

  it("fails on a conflicting restatement", async () => {
    const conflicting = report({ overall: "PASS", statuses: uniform(CORE_RULES, "PASS") }).replace(
      "## Limitations and integrity",
      "### AZD-CORE-002 \u2014 catalog requirement\n\n- **Status:** FAIL\n\n## Limitations and integrity",
    );
    const result = await grade(conflicting, {
      overall_result: "PASS",
      findings: uniform(CORE_RULES, "PASS"),
    });
    assert.equal(result.passed, false);
    assert.ok(failedChecks(result).includes("no-duplicate-findings"));
    assert.ok(failedChecks(result).includes("no-malformed-findings"));
  });
});

describe("malformed output", () => {
  it("fails on a finding with an unrecognised status word", async () => {
    const malformed = report({ overall: "PASS", statuses: uniform(CORE_RULES, "PASS") }).replace(
      "- **Status:** PASS",
      "- **Status:** PASSED",
    );
    const result = await grade(malformed, { overall_result: "PASS", findings: uniform(CORE_RULES, "PASS") });
    assert.equal(result.passed, false);
    assert.ok(failedChecks(result).includes("no-malformed-findings"));
    assert.ok(failedChecks(result).includes("finding-statuses"));
    assert.match(result.evidence, /status-invalid/);
  });

  it("fails when the output is not a report at all", async () => {
    const result = await grade("Sorry, I could not complete the audit.", {
      overall_result: "PASS",
      findings: uniform(CORE_RULES, "PASS"),
    });
    assert.equal(result.passed, false);
    assert.ok(failedChecks(result).includes("report-present"));
  });

  it("fails on an unrecognised overall verdict", async () => {
    const result = await grade(
      report({ statuses: uniform(CORE_RULES, "PASS") }).replace(
        "- **Scope:** evidence.yaml",
        "- **Overall result:** MOSTLY COMPLIANT\n- **Scope:** evidence.yaml",
      ),
      { overall_result: "PASS", findings: uniform(CORE_RULES, "PASS") },
    );
    assert.equal(result.passed, false);
    assert.ok(failedChecks(result).includes("overall-result"));
    assert.ok(failedChecks(result).includes("no-malformed-findings"));
  });
});

describe("summary counts", () => {
  it("fails when the declared counts contradict the findings", async () => {
    const result = await grade(
      report({
        overall: "PASS",
        statuses: uniform(CORE_RULES, "PASS"),
        summary: { applicable: 6, pass: 5, fail: 1, unknown: 0 },
      }),
      { overall_result: "PASS", findings: uniform(CORE_RULES, "PASS") },
    );
    assert.equal(result.passed, false);
    assert.deepEqual(failedChecks(result), ["summary-counts"]);
    assert.match(result.evidence, /pass: summary says 5, findings show 6/);
  });

  it("fails when the summary section is absent", async () => {
    const result = await grade(
      report({ overall: "PASS", statuses: uniform(CORE_RULES, "PASS"), summaryStyle: "none" }),
      { overall_result: "PASS", findings: uniform(CORE_RULES, "PASS") },
    );
    assert.equal(result.passed, false);
    assert.deepEqual(failedChecks(result), ["summary-counts"]);
  });

  it("accepts summary counts rendered as a metric table", async () => {
    const result = await grade(
      report({ overall: "PASS", statuses: uniform(CORE_RULES, "PASS"), summaryStyle: "table" }),
      { overall_result: "PASS", findings: uniform(CORE_RULES, "PASS") },
    );
    assert.equal(result.passed, true, result.evidence);
  });
});

describe("non-trigger stimulus", () => {
  const config = { expect_report: false };

  it("passes when the agent simply edits the template", async () => {
    const result = await grade(
      "I added an `owner` field to `templates/deployment.yaml` and reformatted each section.",
      config,
    );
    assert.equal(result.passed, true, result.evidence);
    assert.deepEqual(failedChecks(result), []);
  });

  it("fails when the agent returns a compliance verdict anyway", async () => {
    const result = await grade(report({ overall: "FAIL", statuses: uniform(CORE_RULES, "FAIL") }), config);
    assert.equal(result.passed, false);
    assert.deepEqual(failedChecks(result), ["no-compliance-report"]);
    assert.match(result.evidence, /Expected no compliance report/);
  });
});
