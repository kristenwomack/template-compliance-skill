// Shared report builders for the grader tests.
//
// These produce contract-shaped Markdown reports (see
// `skills/template-compliance/references/report-format.md`) so the tests
// exercise the parser against realistic output rather than hand-tuned strings.

import { DEFAULT_INTEGRITY_STATEMENT } from "../report-parser.js";

export const CORE_RULES = Object.freeze([
  "AZD-CORE-001",
  "AZD-CORE-002",
  "AZD-CORE-003",
  "AZD-CORE-004",
  "AZD-CORE-005",
  "AZD-CORE-006",
]);

export const AWESOME_RULES = Object.freeze([
  "AZD-AWESOME-001",
  "AZD-AWESOME-002",
  "AZD-AWESOME-003",
  "AZD-AWESOME-004",
  "AZD-AWESOME-005",
  "AZD-AWESOME-006",
  "AZD-AWESOME-007",
  "AZD-AWESOME-008",
]);

export const ALL_RULES = Object.freeze([...CORE_RULES, ...AWESOME_RULES]);

/** Build a `{rule: status}` map with one status for every listed rule. */
export function uniform(rules, status) {
  return Object.fromEntries(rules.map((rule) => [rule, status]));
}

function tally(statuses) {
  const counts = { applicable: 0, pass: 0, fail: 0, unknown: 0 };
  for (const status of Object.values(statuses)) {
    counts.applicable += 1;
    if (status === "PASS") counts.pass += 1;
    else if (status === "FAIL") counts.fail += 1;
    else counts.unknown += 1;
  }
  return counts;
}

/**
 * Render a compliance report.
 *
 * @param {object} options
 * @param {string} [options.overall] Overall result for the header.
 * @param {Record<string,string>} [options.statuses] Findings to render, in order.
 * @param {"sections"|"table"} [options.style] Finding presentation.
 * @param {"labels"|"table"|"none"} [options.summaryStyle] Summary presentation.
 * @param {object} [options.summary] Explicit summary counts (for mismatch tests).
 * @param {boolean} [options.integrity] Emit the required integrity statement.
 * @param {string[]} [options.extraLines] Appended verbatim before the integrity block.
 */
export function report({
  overall,
  statuses = {},
  style = "sections",
  summaryStyle = "labels",
  summary,
  integrity = true,
  extraLines = [],
} = {}) {
  const counts = summary ?? tally(statuses);
  const lines = [
    "# Compliance Report",
    "",
    "- **Scope:** evidence.yaml",
    "- **Catalog:** bundled template-compliance catalog",
    "- **Inspection mode:** read-only",
  ];
  if (overall !== undefined) lines.push(`- **Overall result:** \`${overall}\``);
  lines.push("");

  if (summaryStyle === "labels") {
    lines.push(
      "## Summary",
      "",
      `- **Applicable rules:** ${counts.applicable}`,
      `- **Pass:** ${counts.pass}`,
      `- **Fail:** ${counts.fail}`,
      `- **Unable to determine:** ${counts.unknown}`,
      "",
    );
  } else if (summaryStyle === "table") {
    lines.push(
      "## Summary",
      "",
      "| Applicable rules | Pass | Fail | Unable to determine |",
      "| --- | --- | --- | --- |",
      `| ${counts.applicable} | ${counts.pass} | ${counts.fail} | ${counts.unknown} |`,
      "",
    );
  }

  const entries = Object.entries(statuses);
  if (entries.length > 0) {
    lines.push("## Findings", "");
    if (style === "table") {
      lines.push("| Rule | Target | Status | Evidence |", "| --- | --- | --- | --- |");
      for (const [rule, status] of entries) {
        lines.push(`| ${rule} | evidence.yaml | ${status} | evidence.yaml field for ${rule} |`);
      }
      lines.push("");
    } else {
      for (const [rule, status] of entries) {
        lines.push(
          `### ${rule} \u2014 catalog requirement`,
          "",
          `- **Target:** evidence.yaml`,
          `- **Status:** ${status}`,
          `- **Evidence:** evidence.yaml field for ${rule}`,
          `- **Rationale:** the cited evidence settles the rule criteria`,
          status === "FAIL" ? `- **Remediation:** apply the documented change for ${rule}` : null,
          status === "UNABLE TO DETERMINE" ? `- **Evidence needed:** a readable record for ${rule}` : null,
          "",
        );
      }
    }
  }

  lines.push(...extraLines);

  lines.push("## Limitations and integrity", "");
  if (integrity) lines.push(`> ${DEFAULT_INTEGRITY_STATEMENT}`, "");

  return lines.filter((line) => line !== null).join("\n");
}
