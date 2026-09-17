// Unit tests for the template-compliance report parser.
//
// Run with `npm test` (Node's built-in test runner — no extra dependency).

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_INTEGRITY_STATEMENT,
  countFindings,
  normalizeStatus,
  parseReport,
} from "../report-parser.js";

import { CORE_RULES, report } from "./report-fixtures.js";

describe("normalizeStatus", () => {
  it("accepts the three contract statuses verbatim", () => {
    assert.equal(normalizeStatus("PASS"), "PASS");
    assert.equal(normalizeStatus("FAIL"), "FAIL");
    assert.equal(normalizeStatus("UNABLE TO DETERMINE"), "UNABLE TO DETERMINE");
  });

  it("strips decoration that the contract does not forbid", () => {
    assert.equal(normalizeStatus(" `PASS` "), "PASS");
    assert.equal(normalizeStatus("**FAIL**"), "FAIL");
    assert.equal(normalizeStatus("\u2705 PASS"), "PASS");
    assert.equal(normalizeStatus("PASS (see evidence)"), "PASS");
    assert.equal(normalizeStatus("UNABLE TO DETERMINE \u2014 README unreadable"), "UNABLE TO DETERMINE");
    assert.equal(normalizeStatus("UNABLE-TO-DETERMINE"), "UNABLE TO DETERMINE");
  });

  it("does not silently repair a different word", () => {
    assert.equal(normalizeStatus("PASSED"), "PASSED");
    assert.equal(normalizeStatus("N/A"), "N");
    assert.equal(normalizeStatus("NOT APPLICABLE"), "NOT APPLICABLE");
    assert.equal(normalizeStatus(undefined), "");
  });
});

describe("parseReport — well-formed reports", () => {
  it("parses a PASS report rendered as subsections", () => {
    const parsed = parseReport(report({ overall: "PASS", statuses: Object.fromEntries(CORE_RULES.map((r) => [r, "PASS"])) }));
    assert.equal(parsed.overallResult, "PASS");
    assert.deepEqual(
      parsed.findings,
      Object.fromEntries(CORE_RULES.map((r) => [r, "PASS"])),
    );
    assert.deepEqual(parsed.malformed, []);
    assert.deepEqual(parsed.duplicates, []);
    assert.deepEqual(parsed.summary, { applicable: 6, pass: 6, fail: 0, unknown: 0, source: "labels" });
    assert.equal(parsed.integrityStatementFound, true);
    assert.equal(parsed.hasReportSignals, true);
  });

  it("parses a mixed FAIL report", () => {
    const statuses = {
      "AZD-CORE-001": "FAIL",
      "AZD-CORE-002": "UNABLE TO DETERMINE",
      "AZD-CORE-003": "UNABLE TO DETERMINE",
      "AZD-CORE-004": "UNABLE TO DETERMINE",
      "AZD-CORE-005": "UNABLE TO DETERMINE",
      "AZD-CORE-006": "UNABLE TO DETERMINE",
    };
    const parsed = parseReport(report({ overall: "FAIL", statuses }));
    assert.equal(parsed.overallResult, "FAIL");
    assert.deepEqual(parsed.findings, statuses);
    assert.deepEqual(countFindings(parsed.findings), { applicable: 6, pass: 0, fail: 1, unknown: 5 });
    assert.deepEqual(parsed.malformed, []);
  });

  it("parses an UNABLE TO DETERMINE report", () => {
    const statuses = Object.fromEntries(CORE_RULES.map((r) => [r, "UNABLE TO DETERMINE"]));
    const parsed = parseReport(report({ overall: "UNABLE TO DETERMINE", statuses }));
    assert.equal(parsed.overallResult, "UNABLE TO DETERMINE");
    assert.deepEqual(parsed.findings, statuses);
    assert.deepEqual(parsed.summary, { applicable: 6, pass: 0, fail: 0, unknown: 6, source: "labels" });
  });

  it("parses findings rendered as a Markdown table", () => {
    const parsed = parseReport(
      report({
        overall: "PASS",
        statuses: Object.fromEntries(CORE_RULES.map((r) => [r, "PASS"])),
        style: "table",
      }),
    );
    assert.deepEqual(
      parsed.findings,
      Object.fromEntries(CORE_RULES.map((r) => [r, "PASS"])),
    );
    assert.deepEqual(parsed.malformed, []);
    assert.deepEqual(parsed.duplicates, []);
    assert.equal(parsed.findingRecords.every((r) => r.source === "table"), true);
  });

  it("reads summary counts from a metric table", () => {
    const parsed = parseReport(
      report({
        overall: "PASS",
        statuses: Object.fromEntries(CORE_RULES.map((r) => [r, "PASS"])),
        summaryStyle: "table",
      }),
    );
    assert.deepEqual(parsed.summary, { applicable: 6, pass: 6, fail: 0, unknown: 0, source: "table" });
  });

  it("treats a heading that restates its own rule ID as one finding", () => {
    const parsed = parseReport(`
## Findings

### AZD-CORE-001 \u2014 azure.yaml at repository root

- **Rule:** AZD-CORE-001 \u2014 azure.yaml at repository root
- **Target:** azure.yaml
- **Status:** PASS
- **Evidence:** root listing contains azure.yaml

#### Evidence detail

- **Rationale:** the root listing is readable
`);
    assert.deepEqual(parsed.findings, { "AZD-CORE-001": "PASS" });
    assert.equal(parsed.findingRecords.length, 1);
    assert.deepEqual(parsed.duplicates, []);
  });

  it("finds the integrity statement inside a blockquote", () => {
    const parsed = parseReport(`- **Overall result:** PASS\n\n> ${DEFAULT_INTEGRITY_STATEMENT}\n`);
    assert.equal(parsed.integrityStatementFound, true);
  });
});

describe("parseReport — malformed output", () => {
  it("flags an unrecognised finding status", () => {
    const parsed = parseReport(`
## Findings

### AZD-CORE-001
- **Status:** PASSED
`);
    assert.deepEqual(parsed.findings, {});
    assert.equal(parsed.malformed.length, 1);
    assert.equal(parsed.malformed[0].reason, "status-invalid");
    assert.equal(parsed.malformed[0].ruleId, "AZD-CORE-001");
  });

  it("flags a finding with no status at all", () => {
    const parsed = parseReport(`
## Findings

### AZD-CORE-001
- **Evidence:** root listing contains azure.yaml

## Limitations
`);
    assert.equal(parsed.malformed.length, 1);
    assert.equal(parsed.malformed[0].reason, "status-missing");
  });

  it("flags a rule field carrying no rule ID", () => {
    const parsed = parseReport(`
## Findings

- **Rule:** the azure.yaml rule
- **Status:** PASS
`);
    assert.equal(parsed.malformed.length, 1);
    assert.equal(parsed.malformed[0].reason, "rule-id-missing");
    assert.equal(parsed.malformed[0].ruleId, null);
  });

  it("flags an unrecognised overall result", () => {
    const parsed = parseReport("- **Overall result:** MOSTLY COMPLIANT\n");
    assert.equal(parsed.overallResult, null);
    assert.equal(parsed.overallResultRaw, "MOSTLY COMPLIANT");
    assert.equal(parsed.malformed[0].reason, "overall-result-invalid");
  });

  it("flags a table row whose status cell is empty", () => {
    const parsed = parseReport(`
| Rule | Target | Status |
| --- | --- | --- |
| AZD-CORE-001 | azure.yaml |  |
`);
    assert.equal(parsed.malformed.length, 1);
    assert.equal(parsed.malformed[0].reason, "status-missing");
  });

  it("flags a finding that names two rule IDs", () => {
    const parsed = parseReport(`
### AZD-CORE-001 and AZD-CORE-002
- **Status:** PASS
`);
    assert.equal(parsed.malformed.length, 1);
    assert.equal(parsed.malformed[0].reason, "ambiguous-rule-id");
  });
});

describe("parseReport — duplicates", () => {
  it("flags a rule reported twice in the same form", () => {
    const parsed = parseReport(`
### AZD-CORE-001
- **Status:** PASS

### AZD-CORE-001
- **Status:** PASS
`);
    assert.equal(parsed.duplicates.length, 1);
    assert.equal(parsed.duplicates[0].reason, "repeated-finding");
    assert.deepEqual(parsed.findings, { "AZD-CORE-001": "PASS" });
  });

  it("flags a rule reported twice with conflicting statuses", () => {
    const parsed = parseReport(`
### AZD-CORE-001
- **Status:** PASS

### AZD-CORE-001
- **Status:** FAIL
`);
    assert.equal(parsed.duplicates.length, 1);
    assert.equal(parsed.duplicates[0].reason, "conflicting-status");
    assert.equal(parsed.findings["AZD-CORE-001"], null);
    assert.equal(parsed.malformed.some((m) => m.reason === "conflicting-status"), true);
  });

  it("flags a summary table that restates a subsection finding consistently", () => {
    const parsed = parseReport(`
| Rule | Status |
| --- | --- |
| AZD-CORE-001 | PASS |

### AZD-CORE-001
- **Status:** PASS
`);
    assert.equal(parsed.duplicates.length, 1);
    assert.equal(parsed.duplicates[0].reason, "repeated-finding");
    assert.deepEqual(parsed.findings, { "AZD-CORE-001": "PASS" });
  });
});

describe("parseReport — non-report output", () => {
  it("reports no signals for an ordinary editing answer", () => {
    const parsed = parseReport(`
I updated \`templates/deployment.yaml\`:

\`\`\`yaml
owner: platform-team
\`\`\`

The file now has an owner field and consistent formatting.
`);
    assert.equal(parsed.hasReportSignals, false);
    assert.deepEqual(parsed.findings, {});
    assert.equal(parsed.overallResult, null);
  });
});
