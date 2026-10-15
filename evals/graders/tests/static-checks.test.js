import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import YAML from "yaml";

test("CI runs the same complete catalog/test/parity/lint gate as local checks", () => {
  const workflow = YAML.parse(fs.readFileSync(new URL("../../../.github/workflows/static-checks.yml", import.meta.url), "utf8"));
  const pkg = JSON.parse(fs.readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
  const commands = workflow.jobs.check.steps.map((step) => step.run).filter(Boolean);
  assert.ok(commands.includes("npm run check"));
  assert.equal(pkg.scripts.check, "npm run catalog:check && npm run test && npm run parity && npm run lint");
});
