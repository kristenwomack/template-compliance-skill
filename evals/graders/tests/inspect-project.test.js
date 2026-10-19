import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { inspectProject } from "../../../skills/azd/scripts/inspect-project.mjs";

const script = fileURLToPath(new URL("../../../skills/azd/scripts/inspect-project.mjs", import.meta.url));
const fixtures = fileURLToPath(new URL("../../fixtures/", import.meta.url));

async function temporary(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "azd-project-"));
  try { await run(root); } finally { await fs.rm(root, { recursive: true, force: true }); }
}

function state(result, name) {
  return result.facts.find((fact) => fact.path === path.join(result.project_root, name))?.state;
}

describe("read-only project diagnostics", () => {
  it("reports existing code without configuration as setup facts, not publication failures", async () => {
    const result = await inspectProject({ root: path.join(fixtures, "existing-code/project") });
    assert.equal(result.assessment, "project-diagnostics");
    assert.equal(state(result, "azure.yaml"), "missing");
    assert.deepEqual(result.root_build_manifests, ["package.json"]);
    assert.ok(result.gaps.some((gap) => gap.includes("initialization is not established")));
    assert.equal(result.findings, undefined);
    assert.equal(result.remaining_rules, undefined);
    assert.doesNotMatch(JSON.stringify(result), /AZD-CORE|AZD-AWESOME|required_headings|required_repository_topics/);
  });

  for (const name of ["partial-setup", "template-derived", "existing-configuration"]) {
    it(`preserves ${name} without inferring deployment or requiring infrastructure`, async () => {
      const result = await inspectProject({ root: path.join(fixtures, name, "project") });
      assert.equal(state(result, "azure.yaml"), "present");
      assert.equal(state(result, "infra"), "missing");
      assert.equal(result.origin, undefined);
      assert.equal(result.deployed, undefined);
      assert.equal(result.destination_profile, undefined);
      assert.ok(result.limitations.some((item) => item.includes("not inferred")));
      assert.ok(result.limitations.some((item) => item.includes("not a failure")));
    });
  }

  it("does not echo configuration, environment contents, or execute hooks/build scripts", async () => {
    await temporary(async (root) => {
      const config = "name: app\nhooks:\n  predeploy:\n    run: secret-hook-value\n";
      await fs.writeFile(path.join(root, "azure.yaml"), config);
      await fs.mkdir(path.join(root, ".azure"));
      await fs.writeFile(path.join(root, ".azure", "config.json"), '{"secret":"never-echo"}');
      await fs.writeFile(path.join(root, "package.json"), '{"scripts":{"build":"untrusted-command"}}');
      const before = await fs.readdir(root);
      const result = await inspectProject({ root });
      assert.equal(state(result, ".azure"), "present");
      assert.equal(state(result, ".gitignore"), "missing");
      assert.doesNotMatch(JSON.stringify(result), /secret-hook-value|never-echo|untrusted-command/);
      assert.deepEqual(await fs.readdir(root), before);
      assert.equal(await fs.readFile(path.join(root, "azure.yaml"), "utf8"), config);
      assert.ok(JSON.stringify(result).length < 4000);
    });
  });

  it("keeps unreadable/missing roots unknown instead of proving absence", async () => {
    await temporary(async (root) => {
      const result = await inspectProject({ root: path.join(root, "absent") });
      assert.equal(result.root_listing, "unknown");
      assert.ok(result.facts.every((fact) => fact.state === "unknown"));
      assert.ok(result.gaps.some((gap) => gap.includes("unknown")));
    });
  });

  it("does not traverse an infrastructure junction outside the selected root", async (t) => {
    await temporary(async (parent) => {
      const root = path.join(parent, "project");
      const outside = path.join(parent, "outside");
      await fs.mkdir(root);
      await fs.mkdir(outside);
      await fs.writeFile(path.join(outside, "private.txt"), "never-echo");
      try {
        await fs.symlink(outside, path.join(root, "infra"), process.platform === "win32" ? "junction" : "dir");
      } catch (error) {
        if (["EPERM", "EACCES", "ENOTSUP"].includes(error.code)) return t.skip(error.code);
        throw error;
      }
      const result = await inspectProject({ root });
      assert.equal(state(result, "infra"), "unknown");
      assert.doesNotMatch(JSON.stringify(result), /private\.txt|never-echo/);
    });
  });

  it("handles CLI roots with spaces and rejects implicit roots or unsupported flags", async () => {
    await temporary(async (parent) => {
      const root = path.join(parent, "project with spaces");
      await fs.mkdir(root);
      const result = spawnSync(process.execPath, [script, "--root", root], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(JSON.parse(result.stdout).project_root, root);
      for (const args of [[], ["--profile", "core-only"], ["--root", root, "--deploy"], ["--root", root, "--root", root]]) {
        const invalid = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
        assert.equal(invalid.status, 1);
        assert.match(invalid.stderr, /Usage:/);
        assert.equal(invalid.stdout, "");
      }
    });
    await assert.rejects(inspectProject({}), /explicit --root/);
  });
});
