// Static parity between the nine legacy `evals/tasks/*.yaml` fixtures and the
// Vally suite in `evals/eval.yaml`.
//
// The legacy YAML files predate the Vally migration and are still the
// human-readable source of truth for what each scenario expects. They stay in
// the repository until live behavioural parity has actually been observed, so
// this module keeps the two descriptions from silently drifting apart:
//
//   * every legacy task has exactly one Vally stimulus, and vice versa;
//   * each stimulus stages the fixture directory that belongs to its task;
//   * the deterministic grader's expected overall result and
//     {rule ID: status} map are identical to the legacy `expected` block;
//   * trigger/non-trigger intent matches the skill-invocation grader and the
//     grader's `expect_report` setting; and
//   * every legacy assertion list still has a qualitative rubric behind it.
//
// Nothing here runs an agent or needs credentials.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

import { resolveConfig } from "../graders/template-compliance-report.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(HERE, "..", "..");
export const EVALS_DIR = path.join(REPO_ROOT, "evals");
export const EVAL_SPEC = path.join(EVALS_DIR, "eval.yaml");
export const TASKS_DIR = path.join(EVALS_DIR, "tasks");

const GRADER_TYPE = "template-compliance-report";
const SKILL_NAME = "template-compliance";

function readYaml(file) {
  return YAML.parse(fs.readFileSync(file, "utf8"));
}

function sortedEntries(map) {
  return Object.entries(map ?? {}).sort(([a], [b]) => a.localeCompare(b));
}

function sameMap(a, b) {
  const left = sortedEntries(a);
  const right = sortedEntries(b);
  if (left.length !== right.length) return false;
  return left.every(([key, value], i) => right[i][0] === key && right[i][1] === value);
}

function describeMap(map) {
  const entries = sortedEntries(map);
  if (entries.length === 0) return "(none)";
  return entries.map(([k, v]) => `${k}=${v}`).join(", ");
}

function graderOfType(stimulus, type) {
  return (stimulus.graders ?? []).find((g) => g && g.type === type);
}

/** Load the legacy tasks, keyed by their `id`. */
export function loadLegacyTasks() {
  const files = fs
    .readdirSync(TASKS_DIR)
    .filter((name) => name.endsWith(".yaml"))
    .sort();
  return files.map((name) => {
    const file = path.join(TASKS_DIR, name);
    const doc = readYaml(file);
    return { file: path.relative(REPO_ROOT, file), name, ...doc };
  });
}

/** Load the Vally stimuli from `evals/eval.yaml`. */
export function loadStimuli() {
  const spec = readYaml(EVAL_SPEC);
  return { spec, stimuli: spec.stimuli ?? [] };
}

/**
 * Compare the legacy fixtures against the Vally suite.
 *
 * @returns {{violations: Array<{code: string, subject: string, message: string}>, checked: number}}
 */
export function checkParity() {
  const violations = [];
  const add = (code, subject, message) => violations.push({ code, subject, message });

  const tasks = loadLegacyTasks();
  const { stimuli } = loadStimuli();

  const taskById = new Map();
  for (const task of tasks) {
    if (typeof task.id !== "string" || task.id.length === 0) {
      add("legacy-id-missing", task.name, "Legacy task has no `id`.");
      continue;
    }
    if (taskById.has(task.id)) {
      add("legacy-id-duplicate", task.id, `Two legacy tasks share the id ${task.id}.`);
      continue;
    }
    taskById.set(task.id, task);
  }

  const stimulusByName = new Map();
  for (const stimulus of stimuli) {
    if (typeof stimulus.name !== "string" || stimulus.name.length === 0) {
      add("stimulus-name-missing", "(unnamed)", "Stimulus has no `name`.");
      continue;
    }
    if (stimulusByName.has(stimulus.name)) {
      add("stimulus-name-duplicate", stimulus.name, `Two stimuli share the name ${stimulus.name}.`);
      continue;
    }
    stimulusByName.set(stimulus.name, stimulus);
  }

  for (const id of taskById.keys()) {
    if (!stimulusByName.has(id)) {
      add("missing-stimulus", id, `Legacy task ${id} has no Vally stimulus of the same name.`);
    }
  }
  for (const name of stimulusByName.keys()) {
    if (!taskById.has(name)) {
      add("orphan-stimulus", name, `Vally stimulus ${name} has no legacy task of the same id.`);
    }
  }

  let checked = 0;
  for (const [id, task] of taskById) {
    const stimulus = stimulusByName.get(id);
    if (!stimulus) continue;
    checked += 1;

    // --- staged fixtures ---------------------------------------------------
    const files = stimulus.agent_environment?.files ?? stimulus.environment?.files ?? [];
    if (files.length === 0) {
      add("fixture-missing", id, "Stimulus stages no fixture files.");
    }
    for (const entry of files) {
      const src = entry?.src;
      if (typeof src !== "string") {
        add("fixture-missing", id, "Staged file entry has no `src`.");
        continue;
      }
      const expectedPrefix = `fixtures/${id}/`;
      if (!src.startsWith(expectedPrefix)) {
        add(
          "fixture-path-mismatch",
          id,
          `Staged source ${src} is not under ${expectedPrefix}, so the stimulus does not use its own fixture.`,
        );
      }
      const onDisk = path.join(EVALS_DIR, src);
      if (!fs.existsSync(onDisk)) {
        add("fixture-missing", id, `Staged source ${src} does not exist on disk.`);
      }
      if (typeof entry.dest !== "string" || entry.dest.length === 0) {
        add("fixture-missing", id, `Staged source ${src} has no \`dest\`.`);
      }
    }

    // --- prompt and rubric -------------------------------------------------
    if (typeof stimulus.prompt !== "string" || stimulus.prompt.trim().length === 0) {
      add("prompt-missing", id, "Stimulus has no prompt.");
    }
    if (typeof task.prompt !== "string" || task.prompt.trim().length === 0) {
      add("prompt-missing", id, "Legacy task has no prompt.");
    }
    const assertions = task.expected?.assertions ?? [];
    const rubric = stimulus.rubric ?? [];
    if (assertions.length > 0 && rubric.length === 0) {
      add(
        "rubric-missing",
        id,
        `Legacy task declares ${assertions.length} qualitative assertion(s) but the stimulus has no rubric.`,
      );
    }

    // --- routing intent ----------------------------------------------------
    const invocation = graderOfType(stimulus, "skill-invocation");
    const shouldTrigger = task.should_trigger !== false;
    if (!invocation) {
      add("trigger-grader-mismatch", id, "Stimulus has no skill-invocation grader.");
    } else if (shouldTrigger) {
      const required = invocation.config?.required ?? [];
      if (!required.includes(SKILL_NAME)) {
        add(
          "trigger-grader-mismatch",
          id,
          `Legacy task expects template-compliance to trigger, but skill-invocation does not require it.`,
        );
      }
    } else {
      const disallowed = invocation.config?.disallowed ?? [];
      if (!disallowed.includes(SKILL_NAME)) {
        add(
          "trigger-grader-mismatch",
          id,
          `Legacy task expects template-compliance NOT to trigger, but skill-invocation does not disallow it.`,
        );
      }
    }

    // --- deterministic expectations ---------------------------------------
    const reportGrader = graderOfType(stimulus, GRADER_TYPE);
    if (!reportGrader) {
      add("grader-missing", id, `Stimulus has no ${GRADER_TYPE} grader.`);
      continue;
    }

    let resolved;
    try {
      resolved = resolveConfig(reportGrader.config);
    } catch (err) {
      add("grader-config-invalid", id, err.message);
      continue;
    }

    if (!shouldTrigger) {
      if (resolved.expectReport !== false) {
        add(
          "expect-report-mismatch",
          id,
          "Legacy task is a non-trigger case, so the grader must set `expect_report: false`.",
        );
      }
    } else if (resolved.expectReport === false) {
      add(
        "expect-report-mismatch",
        id,
        "Legacy task expects the skill to trigger, so the grader must not set `expect_report: false`.",
      );
    }

    const legacyOverall = task.expected?.overall_result;
    if (legacyOverall === undefined) {
      if (resolved.overallResult !== undefined) {
        add(
          "overall-result-mismatch",
          id,
          `Legacy task declares no overall result, but the grader expects ${resolved.overallResult}.`,
        );
      }
    } else if (resolved.overallResult !== legacyOverall) {
      add(
        "overall-result-mismatch",
        id,
        `Legacy task expects overall result ${legacyOverall}, grader expects ${resolved.overallResult ?? "(none)"}.`,
      );
    }

    const legacyStatuses = task.expected?.finding_status;
    if (legacyStatuses === undefined) {
      if (resolved.findings !== undefined) {
        add(
          "finding-status-mismatch",
          id,
          `Legacy task declares no finding statuses, but the grader expects ${describeMap(resolved.findings)}.`,
        );
      }
    } else if (!sameMap(legacyStatuses, resolved.findings)) {
      add(
        "finding-status-mismatch",
        id,
        `Status map differs.\n      legacy: ${describeMap(legacyStatuses)}\n      vally:  ${describeMap(resolved.findings)}`,
      );
    }

    // A legacy task that declares an overall result enumerates every applicable
    // rule, so the Vally expectation must be exhaustive. A task that declares
    // only some statuses must not be.
    if (legacyStatuses !== undefined) {
      const expectExhaustive = legacyOverall !== undefined;
      if (resolved.exhaustive !== expectExhaustive) {
        add(
          "exhaustive-mismatch",
          id,
          expectExhaustive
            ? "Legacy task enumerates every applicable rule, so the grader must be exhaustive."
            : "Legacy task constrains only some rules, so the grader must set `exhaustive: false`.",
        );
      }
    }
  }

  return { violations, checked, taskCount: taskById.size, stimulusCount: stimulusByName.size };
}
