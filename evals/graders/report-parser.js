// Deterministic parser for template-compliance Markdown reports.
//
// The report contract lives in
// `skills/template-compliance/references/report-format.md`. This module turns a
// report into structured data without any model in the loop, so an eval can
// assert the exact overall result and the exact {rule ID: status} map instead of
// asking a judge to eyeball it.
//
// Parsing is intentionally strict: anything that is recognisably a finding but
// does not carry a well-formed status is reported as malformed rather than
// silently dropped.

/** Verdicts allowed in the report header. */
export const OVERALL_RESULTS = Object.freeze([
  "PASS",
  "FAIL",
  "UNABLE TO DETERMINE",
  "NO ACTIVE APPLICABLE RULES",
]);

/** Statuses allowed on an individual finding. */
export const FINDING_STATUSES = Object.freeze(["PASS", "FAIL", "UNABLE TO DETERMINE"]);

/** Rule IDs the bundled catalog issues, e.g. `AZD-CORE-001`, `AZD-AWESOME-008`. */
export const DEFAULT_RULE_ID_PATTERN = "AZD-[A-Z]+-\\d{3}";

/** Closing sentence the report contract requires. */
export const DEFAULT_INTEGRITY_STATEMENT = "No target templates were modified.";

const OVERALL_SET = new Set(OVERALL_RESULTS);
const FINDING_SET = new Set(FINDING_STATUSES);

const HEADING_RE = /^\s{0,3}(#{1,6})\s+(.*)$/;
const RULE_FIELD_RE = /^\s*(?:[-*+]\s+)?\**\s*rule(?:\s*id)?\s*\**\s*:\s*(.*)$/i;
const STATUS_FIELD_RE = /^\s*(?:[-*+]\s+)?\**\s*(?:status|finding\s+status|result)\s*\**\s*:\s*(.*)$/i;
const LABEL_VALUE_RE = /^\s*(?:[-*+]\s+)?\**\s*([^:*|]+?)\s*\**\s*:\s*(.*)$/;

const RULE_COLUMN_LABELS = new Set([
  "rule",
  "rule id",
  "ruleid",
  "id",
  "rule / target",
  "rule and target",
]);
const STATUS_COLUMN_LABELS = new Set(["status", "result", "finding", "finding status", "verdict"]);

const OVERALL_LABEL_RE = /^overall(?:\s+(?:result|status|verdict|compliance))?$/;

const SUMMARY_LABELS = [
  [
    "applicable",
    /^(?:applicable(?:\s+rules)?|rules\s+applicable|total(?:\s+applicable)?(?:\s+rules)?|total\s+findings|findings)$/,
  ],
  ["pass", /^(?:pass(?:ed)?(?:\s+findings)?|passes|passing)$/],
  ["fail", /^(?:fail(?:ed)?(?:\s+findings)?|failures|failing)$/],
  ["unknown", /^(?:unable\s+to\s+determine(?:\s+findings)?|indeterminate|undetermined|unknown)$/],
];

/**
 * Collapse a status token to its canonical form.
 *
 * Tolerates decoration the contract does not forbid (emphasis, backticks, a
 * leading glyph, a trailing parenthetical or em-dash clause) but does not
 * tolerate a different word: `PASSED` and `N/A` stay invalid on purpose.
 */
export function normalizeStatus(raw) {
  if (typeof raw !== "string") return "";
  let value = raw;
  value = value.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ");
  value = value.split(/\u2014|\u2013|--|;|\/|,/u)[0];
  value = value.toUpperCase().replace(/[^A-Z ]+/g, " ");
  return value.replace(/\s+/g, " ").trim();
}

/** Collapse a field or column label to a comparable form. */
export function normalizeLabel(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[`*_~]/g, "")
    .replace(/[:\uFF1A]\s*$/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function stripBlockquote(line) {
  return line.replace(/^\s{0,3}>\s?/, "");
}

function flatten(text) {
  return text
    .replace(/[`*_>~]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function firstInteger(raw) {
  if (typeof raw !== "string") return null;
  const m = /(\d+)/.exec(raw);
  return m ? Number.parseInt(m[1], 10) : null;
}

function isTableLine(line) {
  return line.includes("|") && line.trim().length > 0;
}

function isSeparatorLine(line) {
  const compact = line.trim().replace(/\s+/g, "");
  return compact.includes("-") && /^\|?:?-+:?(?:\|:?-+:?)*\|?$/.test(compact);
}

function splitCells(line) {
  let text = line.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|")) text = text.slice(0, -1);
  return text.split("|").map((cell) => cell.trim());
}

function extractTables(lines) {
  const tables = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isTableLine(lines[i]) || isSeparatorLine(lines[i])) continue;
    if (i + 1 >= lines.length || !isSeparatorLine(lines[i + 1])) continue;
    const header = splitCells(lines[i]);
    const rows = [];
    let j = i + 2;
    for (; j < lines.length; j++) {
      if (!isTableLine(lines[j])) break;
      if (isSeparatorLine(lines[j])) continue;
      rows.push({ index: j, cells: splitCells(lines[j]), raw: lines[j].trim() });
    }
    tables.push({ start: i, end: j - 1, header, rows });
    i = j - 1;
  }
  return tables;
}

function columnIndex(header, labels) {
  return header.findIndex((cell) => labels.has(normalizeLabel(cell)));
}

function summaryKeyFor(label) {
  for (const [key, re] of SUMMARY_LABELS) {
    if (re.test(label)) return key;
  }
  return null;
}

function compileRuleIdMatcher(pattern) {
  const source = pattern ?? DEFAULT_RULE_ID_PATTERN;
  let re;
  try {
    re = new RegExp(`(?:^|[^A-Z0-9-])(${source})(?![A-Z0-9-])`, "g");
  } catch (err) {
    throw new Error(`Invalid rule_id_pattern ${JSON.stringify(source)}: ${err.message}`, { cause: err });
  }
  return (text) => {
    if (typeof text !== "string") return [];
    re.lastIndex = 0;
    const found = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      found.push(m[1]);
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    return found;
  };
}

/**
 * Parse a template-compliance report.
 *
 * @param {string} text Raw agent output.
 * @param {{ruleIdPattern?: string, integrityStatement?: string}} [options]
 * @returns {object} Structured view of the report.
 */
export function parseReport(text, options = {}) {
  const source = typeof text === "string" ? text : "";
  const matchRuleIds = compileRuleIdMatcher(options.ruleIdPattern);
  const integrityStatement = options.integrityStatement ?? DEFAULT_INTEGRITY_STATEMENT;
  const lines = source.split(/\r?\n/).map(stripBlockquote);

  const malformed = [];
  const records = [];
  const tables = extractTables(lines);

  // --- findings rendered as table rows -------------------------------------
  const consumed = new Set();
  const nonFindingTables = [];
  for (const table of tables) {
    const ruleIdx = columnIndex(table.header, RULE_COLUMN_LABELS);
    const statusIdx = columnIndex(table.header, STATUS_COLUMN_LABELS);
    if (ruleIdx < 0 || statusIdx < 0 || ruleIdx === statusIdx) {
      nonFindingTables.push(table);
      continue;
    }
    for (let i = table.start; i <= table.end; i++) consumed.add(i);
    for (const row of table.rows) {
      const ruleCell = row.cells[ruleIdx] ?? "";
      const statusCell = row.cells[statusIdx] ?? "";
      const ids = matchRuleIds(ruleCell);
      if (ids.length === 0) {
        if (matchRuleIds(row.cells.join(" ")).length === 0) continue;
        malformed.push({ ruleId: null, reason: "rule-id-missing", line: row.index + 1, raw: row.raw });
        continue;
      }
      if (ids.length > 1) {
        malformed.push({ ruleId: ids[0], reason: "ambiguous-rule-id", line: row.index + 1, raw: row.raw });
        continue;
      }
      if (statusCell.trim() === "") {
        malformed.push({ ruleId: ids[0], reason: "status-missing", line: row.index + 1, raw: row.raw });
        continue;
      }
      const status = normalizeStatus(statusCell);
      if (!FINDING_SET.has(status)) {
        malformed.push({ ruleId: ids[0], reason: "status-invalid", line: row.index + 1, raw: statusCell });
        continue;
      }
      records.push({ ruleId: ids[0], status, source: "table", line: row.index + 1, raw: row.raw });
    }
  }

  // --- findings rendered as subsections / field lists -----------------------
  const anchors = [];
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const line = lines[i];
    const heading = HEADING_RE.exec(line);
    if (heading) {
      const ids = matchRuleIds(heading[2]);
      anchors.push({
        index: i,
        kind: ids.length > 0 ? "heading" : "section",
        level: heading[1].length,
        ids,
        raw: line.trim(),
      });
      continue;
    }
    const ruleField = RULE_FIELD_RE.exec(line);
    if (ruleField) {
      anchors.push({
        index: i,
        kind: "field",
        level: null,
        ids: matchRuleIds(ruleField[1]),
        raw: line.trim(),
      });
    }
  }

  const hasStatusBetween = (from, to) => {
    for (let i = from + 1; i < to; i++) {
      if (!consumed.has(i) && STATUS_FIELD_RE.test(lines[i])) return true;
    }
    return false;
  };

  // A subsection that restates its own rule ID in a `**Rule:**` field is one
  // finding, not two. Collapse the field anchor into the heading anchor when no
  // status has been declared in between.
  const kept = anchors.filter((anchor, i) => {
    if (anchor.kind !== "field" || anchor.ids.length !== 1) return true;
    const prev = anchors[i - 1];
    if (!prev || prev.kind !== "heading" || prev.ids.length !== 1) return true;
    if (prev.ids[0] !== anchor.ids[0]) return true;
    return hasStatusBetween(prev.index, anchor.index);
  });

  for (let i = 0; i < kept.length; i++) {
    const anchor = kept[i];
    if (anchor.kind === "section") continue;

    let end = lines.length - 1;
    for (let j = i + 1; j < kept.length; j++) {
      const next = kept[j];
      if (next.kind !== "section") {
        end = next.index - 1;
        break;
      }
      // A plain heading only closes the record when it is a sibling or an
      // ancestor of the record's own heading; deeper headings (`#### Evidence`)
      // belong to the record.
      if (anchor.kind !== "heading" || next.level <= anchor.level) {
        end = next.index - 1;
        break;
      }
    }

    if (anchor.ids.length === 0) {
      malformed.push({ ruleId: null, reason: "rule-id-missing", line: anchor.index + 1, raw: anchor.raw });
      continue;
    }
    if (anchor.ids.length > 1) {
      malformed.push({
        ruleId: anchor.ids[0],
        reason: "ambiguous-rule-id",
        line: anchor.index + 1,
        raw: anchor.raw,
      });
      continue;
    }

    let statusRaw = null;
    let statusLine = anchor.index;
    for (let j = anchor.index; j <= end && j < lines.length; j++) {
      if (consumed.has(j)) continue;
      const m = STATUS_FIELD_RE.exec(lines[j]);
      if (m) {
        statusRaw = m[1];
        statusLine = j;
        break;
      }
    }

    if (statusRaw === null) {
      malformed.push({
        ruleId: anchor.ids[0],
        reason: "status-missing",
        line: anchor.index + 1,
        raw: anchor.raw,
      });
      continue;
    }
    const status = normalizeStatus(statusRaw);
    if (!FINDING_SET.has(status)) {
      malformed.push({
        ruleId: anchor.ids[0],
        reason: "status-invalid",
        line: statusLine + 1,
        raw: statusRaw.trim(),
      });
      continue;
    }
    records.push({
      ruleId: anchor.ids[0],
      status,
      source: "fields",
      line: statusLine + 1,
      raw: anchor.raw,
    });
  }

  records.sort((a, b) => a.line - b.line);

  // --- duplicates and conflicts --------------------------------------------
  const byRule = new Map();
  for (const record of records) {
    const bucket = byRule.get(record.ruleId);
    if (bucket) bucket.push(record);
    else byRule.set(record.ruleId, [record]);
  }

  const findings = {};
  const duplicates = [];
  for (const [ruleId, bucket] of byRule) {
    const statuses = new Set(bucket.map((r) => r.status));

    if (statuses.size > 1) {
      duplicates.push({
        ruleId,
        reason: "conflicting-status",
        statuses: [...statuses],
        lines: bucket.map((r) => r.line),
      });
      malformed.push({
        ruleId,
        reason: "conflicting-status",
        line: bucket[0].line,
        raw: [...statuses].join(" vs "),
      });
      findings[ruleId] = null;
      continue;
    }
    if (bucket.length > 1) {
      duplicates.push({
        ruleId,
        reason: "repeated-finding",
        statuses: [...statuses],
        lines: bucket.map((r) => r.line),
      });
    }
    findings[ruleId] = bucket[0].status;
  }

  // --- header verdict -------------------------------------------------------
  const pairs = [];
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const m = LABEL_VALUE_RE.exec(lines[i]);
    if (m) pairs.push({ label: normalizeLabel(m[1]), value: m[2], line: i + 1 });
  }
  for (const table of nonFindingTables) {
    for (const row of table.rows) {
      if (row.cells.length === 2) {
        pairs.push({ label: normalizeLabel(row.cells[0]), value: row.cells[1], line: row.index + 1 });
      }
    }
  }

  let overallResult = null;
  let overallResultRaw = null;
  let overallResultLine = null;
  for (const pair of pairs) {
    if (!OVERALL_LABEL_RE.test(pair.label)) continue;
    overallResultRaw = pair.value.replace(/^[\s*`_~]+/, "").replace(/[\s*`_~]+$/, "");
    overallResultLine = pair.line;
    const normalized = normalizeStatus(pair.value);
    overallResult = OVERALL_SET.has(normalized) ? normalized : null;
    if (overallResult === null) {
      malformed.push({
        ruleId: null,
        reason: "overall-result-invalid",
        line: pair.line,
        raw: overallResultRaw,
      });
    }
    break;
  }

  // --- summary counts -------------------------------------------------------
  let summary = null;
  const counts = { applicable: null, pass: null, fail: null, unknown: null };
  let summarySource = null;

  for (const pair of pairs) {
    const key = summaryKeyFor(pair.label);
    if (!key || counts[key] !== null) continue;
    const value = firstInteger(pair.value);
    if (value === null) continue;
    counts[key] = value;
    summarySource = summarySource ?? "labels";
  }

  for (const table of nonFindingTables) {
    const map = {};
    table.header.forEach((cell, idx) => {
      const key = summaryKeyFor(normalizeLabel(cell));
      if (key && map[key] === undefined) map[key] = idx;
    });
    const keys = Object.keys(map);
    if (keys.length < 2) continue;
    const row = table.rows.find((r) =>
      keys.every((k) => /^\s*\**\s*\d+\s*\**\s*$/.test(r.cells[map[k]] ?? "")),
    );
    if (!row) continue;
    for (const key of keys) counts[key] = firstInteger(row.cells[map[key]]);
    summarySource = "table";
    break;
  }

  if (Object.values(counts).some((v) => v !== null)) {
    summary = { ...counts, source: summarySource };
  }

  const integrityStatementFound = flatten(source).includes(flatten(integrityStatement));

  return {
    overallResult,
    overallResultRaw,
    overallResultLine,
    findings,
    findingRecords: records,
    duplicates,
    malformed,
    summary,
    integrityStatementFound,
    /** True when the output looks like a compliance report at all. */
    hasReportSignals: records.length > 0 || malformed.length > 0 || overallResult !== null,
  };
}

/** Count findings by status, for comparison against the report's own summary. */
export function countFindings(findings) {
  const counts = { applicable: 0, pass: 0, fail: 0, unknown: 0 };
  for (const status of Object.values(findings)) {
    counts.applicable += 1;
    if (status === "PASS") counts.pass += 1;
    else if (status === "FAIL") counts.fail += 1;
    else if (status === "UNABLE TO DETERMINE") counts.unknown += 1;
  }
  return counts;
}
