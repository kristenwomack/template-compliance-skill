// Static parity test: the nine legacy `evals/tasks/*.yaml` fixtures must still
// describe exactly what the Vally suite asserts.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkParity, loadLegacyTasks, loadStimuli } from "../../parity/legacy-parity.js";
import { TemplateComplianceReportGrader, resolveConfig } from "../template-compliance-report.js";
import { ALL_RULES, CORE_RULES, report } from "./report-fixtures.js";

describe("legacy fixture parity", () => {
  it("keeps all nine legacy task fixtures", () => {
    const tasks = loadLegacyTasks();
    assert.equal(tasks.length, 9, "legacy evals/tasks fixtures must be preserved until live parity is observed");
    assert.deepEqual(
      tasks.map((t) => t.id).sort(),
      [
        "all-rules-fail",
        "all-rules-pass",
        "all-rules-unknown",
        "ambiguous-evidence",
        "ambiguous-publication-scope",
        "compliant-template",
        "optional-assets-and-validator-limits",
        "remediation-needed",
        "should-not-trigger",
      ],
    );
  });

  it("maps every legacy task onto exactly one Vally stimulus", () => {
    const tasks = loadLegacyTasks();
    const { stimuli } = loadStimuli();
    assert.deepEqual(
      stimuli.map((s) => s.name).sort(),
      tasks.map((t) => t.id).sort(),
    );
  });

  it("reports no drift between the legacy fixtures and the Vally suite", () => {
    const { violations, checked } = checkParity();
    assert.equal(
      violations.length,
      0,
      violations.map((v) => `[${v.code}] ${v.subject}: ${v.message}`).join("\n"),
    );
    assert.equal(checked, 9);
  });

  it("gives every stimulus a deterministic template-compliance-report grader", () => {
    const { stimuli } = loadStimuli();
    for (const stimulus of stimuli) {
      const grader = (stimulus.graders ?? []).find((g) => g.type === "template-compliance-report");
      assert.ok(grader, `${stimulus.name} has no template-compliance-report grader`);
    }
  });

  it("scores with weights that sum to 1.0 and a full-pass threshold", () => {
    const { spec } = loadStimuli();
    const weights = spec.scoring?.weights ?? {};
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    assert.ok(Math.abs(total - 1) < 0.01, `weights sum to ${total}`);
    assert.equal(spec.scoring?.threshold, 1);
    assert.ok(
      weights["template-compliance-report"] > weights.prompt,
      "the deterministic grader must outweigh the prompt judge",
    );
  });
});

describe("eval.yaml grader configs are satisfiable", () => {
  const grader = new TemplateComplianceReportGrader();
  const { stimuli } = loadStimuli();

  /** Derive the overall verdict the contract requires for a status set. */
  function deriveOverall(statuses) {
    const values = Object.values(statuses);
    if (values.includes("FAIL")) return "FAIL";
    if (values.includes("UNABLE TO DETERMINE")) return "UNABLE TO DETERMINE";
    if (values.length > 0) return "PASS";
    return "NO ACTIVE APPLICABLE RULES";
  }

  for (const stimulus of stimuli) {
    const config = (stimulus.graders ?? []).find((g) => g.type === "template-compliance-report")?.config;

    it(`${stimulus.name}: an ideal report satisfies every declared assertion`, async () => {
      const resolved = resolveConfig(config);

      if (resolved.expectReport === false) {
        const result = await grader.grade({
          trajectory: {
            output: "I added an `owner` field to `templates/deployment.yaml` and reformatted each section.",
          },
          config,
        });
        assert.equal(result.passed, true, result.evidence);
        return;
      }

      const forbidden = new Set(resolved.forbiddenRules);
      const statuses = { ...(resolved.findings ?? {}) };
      if (Object.keys(statuses).length === 0) {
        for (const rule of CORE_RULES) {
          if (!forbidden.has(rule)) statuses[rule] = "UNABLE TO DETERMINE";
        }
      }
      // A non-exhaustive expectation must tolerate rules it does not pin.
      if (!resolved.exhaustive) {
        const extra = ALL_RULES.find((rule) => !(rule in statuses) && !forbidden.has(rule));
        if (extra) statuses[extra] = "PASS";
      }

      const overall = resolved.overallResult ?? deriveOverall(statuses);
      assert.ok(
        !resolved.forbiddenOverall.includes(overall),
        `${stimulus.name}: the ideal report's overall verdict ${overall} is itself forbidden`,
      );

      const result = await grader.grade({ trajectory: { output: report({ overall, statuses }) }, config });
      assert.equal(result.passed, true, `${stimulus.name}: ${result.evidence}`);
    });
  }
});
