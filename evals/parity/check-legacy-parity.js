#!/usr/bin/env node
// CLI wrapper: report legacy-fixture parity and exit non-zero on drift.
//
// Usage: npm run parity

import { checkParity } from "./legacy-parity.js";

const { violations, checked, taskCount, stimulusCount } = checkParity();

console.log(
  `Legacy parity: ${taskCount} task fixture(s), ${stimulusCount} Vally stimulus(es), ${checked} pair(s) compared.`,
);

if (violations.length === 0) {
  console.log("\u2714 Legacy evals/tasks fixtures and the Vally suite agree.");
  process.exit(0);
}

console.error(`\u2716 ${violations.length} parity violation(s):\n`);
for (const violation of violations) {
  console.error(`  [${violation.code}] ${violation.subject}\n      ${violation.message}`);
}
console.error(
  "\nLegacy fixtures are retained until live behavioural parity is observed. " +
    "Update evals/eval.yaml or evals/tasks/*.yaml so the two descriptions agree.",
);
process.exit(1);
