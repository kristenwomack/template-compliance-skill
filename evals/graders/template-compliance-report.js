// Vally grader plugin: `template-compliance-report`.
//
// Registered through the documented plugin contract — a module that exports
// `registerGraders(registry)` and is loaded with
// `vally … --grader-plugin <path>` (see @microsoft/vally `loadGraderPlugin`).
//
// The grader is fully local and deterministic: it parses the agent's Markdown
// compliance report and asserts the exact overall result and the exact
// {rule ID: status} map, plus report hygiene (no missing, unexpected,
// duplicate, or malformed findings; summary counts that match the findings;
// the required integrity statement). Nothing here calls a model or the network.

import {
  DEFAULT_INTEGRITY_STATEMENT,
  FINDING_STATUSES,
  OVERALL_RESULTS,
  countFindings,
  parseReport,
} from "./report-parser.js";

const OVERALL_SET = new Set(OVERALL_RESULTS);
const FINDING_SET = new Set(FINDING_STATUSES);
const GRADER_NAME = "template-compliance-report";

function fail(message) {
  throw new Error(`${GRADER_NAME}: ${message}`);
}

function asBool(value, key) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") fail(`config.${key} must be a boolean`);
  return value;
}

function asStringArray(value, key) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    fail(`config.${key} must be an array of strings`);
  }
  return value;
}

/**
 * `expect_report` is tri-state:
 *   `true`       — a compliance report must be present (default);
 *   `false`      — no compliance verdict or finding may appear at all;
 *   `"optional"` — the stimulus may legitimately answer with a clarifying
 *                  question instead, so only the constraints on a report that
 *                  *is* produced are enforced.
 */
function resolveExpectReport(value) {
  if (value === undefined) return true;
  if (value === true || value === false || value === "optional") return value;
  fail('config.expect_report must be true, false, or "optional"');
  return true;
}

/**
 * Validate and normalize the YAML-authored config.
 *
 * Author mistakes throw (a misspelled expected status must never be silently
 * treated as "no expectation").
 */
export function resolveConfig(raw) {
  const config = raw ?? {};
  if (typeof config !== "object" || Array.isArray(config)) fail("config must be a mapping");

  const known = new Set([
    "expect_report",
    "overall_result",
    "forbidden_overall_results",
    "findings",
    "exhaustive",
    "forbidden_rules",
    "allow_duplicates",
    "require_summary_counts",
    "require_integrity_statement",
    "integrity_statement",
    "rule_id_pattern",
  ]);
  for (const key of Object.keys(config)) {
    if (!known.has(key)) fail(`unknown config key ${JSON.stringify(key)}`);
  }

  const expectReport = resolveExpectReport(config.expect_report);

  let overallResult;
  if (config.overall_result !== undefined) {
    if (typeof config.overall_result !== "string" || !OVERALL_SET.has(config.overall_result)) {
      fail(`config.overall_result must be one of ${OVERALL_RESULTS.join(", ")}`);
    }
    overallResult = config.overall_result;
  }

  const forbiddenOverall = asStringArray(config.forbidden_overall_results, "forbidden_overall_results") ?? [];
  for (const value of forbiddenOverall) {
    if (!OVERALL_SET.has(value)) {
      fail(`config.forbidden_overall_results contains an unknown verdict ${JSON.stringify(value)}`);
    }
  }

  let findings;
  if (config.findings !== undefined) {
    if (typeof config.findings !== "object" || config.findings === null || Array.isArray(config.findings)) {
      fail("config.findings must be a mapping of rule ID to status");
    }
    findings = {};
    for (const [ruleId, status] of Object.entries(config.findings)) {
      if (typeof status !== "string" || !FINDING_SET.has(status)) {
        fail(`config.findings.${ruleId} must be one of ${FINDING_STATUSES.join(", ")}`);
      }
      findings[ruleId] = status;
    }
  }

  const hasFindings = findings !== undefined && Object.keys(findings).length > 0;
  const reportRequired = expectReport === true;
  const reportAllowed = expectReport !== false;
  const exhaustive = asBool(config.exhaustive, "exhaustive") ?? (reportRequired && hasFindings);
  if (exhaustive && !hasFindings && reportAllowed) {
    fail("config.exhaustive requires config.findings");
  }

  const forbiddenRules = asStringArray(config.forbidden_rules, "forbidden_rules") ?? [];
  const allowDuplicates = asBool(config.allow_duplicates, "allow_duplicates") ?? false;
  const requireSummaryCounts =
    asBool(config.require_summary_counts, "require_summary_counts") ?? (reportRequired && exhaustive);
  const requireIntegrityStatement =
    asBool(config.require_integrity_statement, "require_integrity_statement") ??
    (reportRequired && hasFindings);

  if (config.integrity_statement !== undefined && typeof config.integrity_statement !== "string") {
    fail("config.integrity_statement must be a string");
  }
  if (config.rule_id_pattern !== undefined && typeof config.rule_id_pattern !== "string") {
    fail("config.rule_id_pattern must be a string");
  }

  return {
    expectReport,
    overallResult,
    forbiddenOverall,
    findings,
    exhaustive,
    forbiddenRules,
    allowDuplicates,
    requireSummaryCounts,
    requireIntegrityStatement,
    integrityStatement: config.integrity_statement ?? DEFAULT_INTEGRITY_STATEMENT,
    ruleIdPattern: config.rule_id_pattern,
  };
}

function check(name, passed, evidence) {
  return {
    name,
    graderType: GRADER_NAME,
    kind: "code",
    passed,
    score: passed ? 1 : 0,
    evidence,
    label: passed ? "correct" : "incorrect",
  };
}

function listRules(rules) {
  return rules.length > 0 ? rules.join(", ") : "none";
}

function deriveOverallResult(findings) {
  const statuses = Object.values(findings);
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.includes("UNABLE TO DETERMINE")) return "UNABLE TO DETERMINE";
  if (statuses.includes("PASS")) return "PASS";
  return "NO ACTIVE APPLICABLE RULES";
}

/**
 * Evaluate a parsed report against a resolved config.
 *
 * Exported so the tests can exercise the assertions without building a whole
 * Vally trajectory.
 */
export function evaluateReport(parsed, resolved) {
  const details = [];

  if (resolved.expectReport === false) {
    const reported = Object.keys(parsed.findings).sort();
    const passed = !parsed.hasReportSignals;
    details.push(
      check(
        "no-compliance-report",
        passed,
        passed
          ? "No compliance verdict or rule finding was emitted."
          : `Expected no compliance report. Found overall result ${
              parsed.overallResult ?? "none"
            } and findings: ${listRules(reported)}.`,
      ),
    );
    return details;
  }

  if (resolved.expectReport === true) {
    details.push(
      check(
        "report-present",
        parsed.hasReportSignals,
        parsed.hasReportSignals
          ? "Output contains a compliance report."
          : "Output contains no overall result and no rule findings.",
      ),
    );
  }

  if (resolved.overallResult !== undefined) {
    const passed = parsed.overallResult === resolved.overallResult;
    details.push(
      check(
        "overall-result",
        passed,
        passed
          ? `Overall result is ${resolved.overallResult}.`
          : `Expected overall result ${resolved.overallResult}, found ${
              parsed.overallResult ?? `none (raw: ${JSON.stringify(parsed.overallResultRaw)})`
            }.`,
      ),
    );
  }

  if (parsed.hasReportSignals) {
    const expectedOverall = deriveOverallResult(parsed.findings);
    const passed = parsed.overallResult === expectedOverall;
    details.push(
      check(
        "overall-result-consistent",
        passed,
        passed
          ? `Overall result ${expectedOverall} is consistent with the detailed findings.`
          : `Overall result must be ${expectedOverall} for the detailed findings, found ${
              parsed.overallResult ?? `none (raw: ${JSON.stringify(parsed.overallResultRaw)})`
            }.`,
      ),
    );
  }

  if (resolved.forbiddenOverall.length > 0) {
    const hit = parsed.overallResult !== null && resolved.forbiddenOverall.includes(parsed.overallResult);
    details.push(
      check(
        "forbidden-overall-result",
        !hit,
        hit
          ? `Overall result ${parsed.overallResult} is not allowed for this stimulus.`
          : `Overall result is not one of the disallowed verdicts (${resolved.forbiddenOverall.join(", ")}).`,
      ),
    );
  }

  if (resolved.findings) {
    const missing = [];
    const mismatched = [];
    for (const [ruleId, expected] of Object.entries(resolved.findings)) {
      const actual = parsed.findings[ruleId];
      if (actual === undefined) missing.push(ruleId);
      else if (actual !== expected) mismatched.push(`${ruleId}: expected ${expected}, found ${actual ?? "conflicting"}`);
    }
    const passed = missing.length === 0 && mismatched.length === 0;
    details.push(
      check(
        "finding-statuses",
        passed,
        passed
          ? `All ${Object.keys(resolved.findings).length} expected rule statuses match.`
          : [
              missing.length > 0 ? `Missing findings: ${listRules(missing)}.` : null,
              mismatched.length > 0 ? `Status mismatches: ${mismatched.join("; ")}.` : null,
            ]
              .filter(Boolean)
              .join(" "),
      ),
    );
  }

  if (resolved.exhaustive && resolved.findings) {
    const expectedIds = new Set(Object.keys(resolved.findings));
    const unexpected = Object.keys(parsed.findings)
      .filter((ruleId) => !expectedIds.has(ruleId))
      .sort();
    details.push(
      check(
        "no-unexpected-findings",
        unexpected.length === 0,
        unexpected.length === 0
          ? "Report contains no rule IDs beyond the expected set."
          : `Unexpected findings: ${unexpected.join(", ")}.`,
      ),
    );
  }

  if (resolved.forbiddenRules.length > 0) {
    const present = resolved.forbiddenRules.filter((ruleId) => ruleId in parsed.findings).sort();
    details.push(
      check(
        "forbidden-rules-absent",
        present.length === 0,
        present.length === 0
          ? `None of the ${resolved.forbiddenRules.length} out-of-scope rule IDs were reported.`
          : `Out-of-scope rule IDs reported: ${present.join(", ")}.`,
      ),
    );
  }

  if (!resolved.allowDuplicates) {
    const passed = parsed.duplicates.length === 0;
    details.push(
      check(
        "no-duplicate-findings",
        passed,
        passed
          ? "Every rule ID is reported at most once."
          : `Duplicate findings: ${parsed.duplicates
              .map((d) => `${d.ruleId} (${d.reason}, lines ${d.lines.join("/")})`)
              .join("; ")}.`,
      ),
    );
  }

  const passedMalformed = parsed.malformed.length === 0;
  details.push(
    check(
      "no-malformed-findings",
      passedMalformed,
      passedMalformed
        ? "Every finding declares a well-formed rule ID and status."
        : `Malformed report entries: ${parsed.malformed
            .map((m) => `${m.ruleId ?? "(no rule ID)"} ${m.reason} at line ${m.line} (${JSON.stringify(m.raw)})`)
            .join("; ")}.`,
    ),
  );

  if (resolved.requireSummaryCounts) {
    const actual = countFindings(parsed.findings);
    if (!parsed.summary) {
      details.push(check("summary-counts", false, "Report declares no summary counts."));
    } else {
      const problems = [];
      for (const key of ["applicable", "pass", "fail", "unknown"]) {
        const declared = parsed.summary[key];
        if (declared === null || declared === undefined) {
          problems.push(`${key} count missing`);
        } else if (declared !== actual[key]) {
          problems.push(`${key}: summary says ${declared}, findings show ${actual[key]}`);
        }
      }
      details.push(
        check(
          "summary-counts",
          problems.length === 0,
          problems.length === 0
            ? `Summary counts match the ${actual.applicable} detailed findings.`
            : `Summary count mismatch — ${problems.join("; ")}.`,
        ),
      );
    }
  }

  if (resolved.requireIntegrityStatement) {
    details.push(
      check(
        "integrity-statement",
        parsed.integrityStatementFound,
        parsed.integrityStatementFound
          ? "Required no-modification integrity statement is present."
          : `Missing required integrity statement: ${JSON.stringify(resolved.integrityStatement)}.`,
      ),
    );
  }

  return details;
}

export class TemplateComplianceReportGrader {
  metadata = {
    name: GRADER_NAME,
    description:
      "Parses a template-compliance Markdown report and asserts the exact overall result, the exact " +
      "{rule ID: status} map, and report hygiene (no missing, unexpected, duplicate, or malformed " +
      "findings; summary counts consistent with the findings; integrity statement present).",
    behavior: {},
    determinism: "static",
    reference: "reference-free",
    temporalScope: "trajectory-level",
    costProfile: "free",
  };

  /** Pure, config-derived instance name so several instances stay distinguishable. */
  defaultName(config) {
    const c = config ?? {};
    if (c.expect_report === false) return `${GRADER_NAME} absent`;
    const parts = [];
    if (c.expect_report === "optional") parts.push("optional");
    if (typeof c.overall_result === "string") parts.push(c.overall_result);
    if (c.findings && typeof c.findings === "object" && !Array.isArray(c.findings)) {
      parts.push(`${Object.keys(c.findings).length} rules`);
    }
    if (Array.isArray(c.forbidden_rules) && c.forbidden_rules.length > 0) {
      parts.push(`${c.forbidden_rules.length} forbidden`);
    }
    return parts.length > 0 ? `${GRADER_NAME} ${parts.join(" / ")}` : GRADER_NAME;
  }

  /** `expect_report: false` passes on an empty baseline, so oracle reports it as N/A. */
  assertsAbsence(config) {
    return (config ?? {}).expect_report === false;
  }

  async grade(input) {
    if (input.trajectory == null) throw new Error(`${GRADER_NAME}: missing trajectory`);
    const resolved = resolveConfig(input.config);
    const output = typeof input.trajectory.output === "string" ? input.trajectory.output : "";
    const parsed = parseReport(output, {
      ruleIdPattern: resolved.ruleIdPattern,
      integrityStatement: resolved.integrityStatement,
    });

    const details = evaluateReport(parsed, resolved);
    const failed = details.filter((d) => !d.passed);
    const passed = failed.length === 0;

    return {
      name: GRADER_NAME,
      graderType: GRADER_NAME,
      kind: "code",
      passed,
      score: passed ? 1 : 0,
      label: passed ? "correct" : "incorrect",
      evidence: passed
        ? `All ${details.length} report checks passed.`
        : failed.map((d) => `${d.name}: ${d.evidence}`).join(" | "),
      details,
      metadata: {
        overallResult: parsed.overallResult,
        findings: parsed.findings,
        summary: parsed.summary,
        duplicates: parsed.duplicates,
        malformed: parsed.malformed,
        integrityStatementFound: parsed.integrityStatementFound,
      },
    };
  }
}

/** Vally plugin entry point. */
export function registerGraders(registry) {
  registry.register(new TemplateComplianceReportGrader());
}

export default { registerGraders };
