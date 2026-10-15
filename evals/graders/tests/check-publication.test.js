import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { checkPublication, readH2, REQUIRED_HEADINGS, GOVERNANCE_FILES } from "../../../skills/azd/scripts/check-publication.mjs";

const script = fileURLToPath(new URL("../../../skills/azd/scripts/check-publication.mjs", import.meta.url));

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "azd-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

async function write(root, name, content = "") {
  const target = path.join(root, name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
}

function status(result, id) {
  return result.findings.find((finding) => finding.id === id)?.status;
}

test("core/private/organization/unresolved profiles never inspect public artifacts", async (t) => {
  const root = await fixture(t);
  await write(root, "azure.yaml", "name: example");
  for (const profile of ["core-only", "organization-catalog", "unresolved"]) {
    const result = await checkPublication({ root, profile });
    assert.deepEqual(result.findings.map((finding) => finding.id), ["AZD-CORE-001"]);
    assert.equal(status(result, "AZD-CORE-001"), "PASS");
    assert.equal(result.remaining_rules.length, 5);
    assert.ok(result.remaining_rules.every((rule) => rule.id.startsWith("AZD-CORE-")));
    assert.ok(!JSON.stringify(result).includes("AZD-AWESOME-"));
    assert.ok(!JSON.stringify(result).includes("Important Security Notice"));
    assert.equal(result.overall_result, undefined);
  }
});

test("missing files fail, unreadable roots remain unknown, and directories are not files", async (t) => {
  const root = await fixture(t);
  assert.equal(status(await checkPublication({ root, profile: "core-only" }), "AZD-CORE-001"), "FAIL");
  assert.equal(status(await checkPublication({ root: path.join(root, "absent"), profile: "core-only" }), "AZD-CORE-001"), "UNABLE TO DETERMINE");
  await fs.mkdir(path.join(root, "azure.yaml"));
  assert.equal(status(await checkPublication({ root, profile: "core-only" }), "AZD-CORE-001"), "FAIL");
});

test("public checks use the template root for README and repository root for governance", async (t) => {
  const repositoryRoot = await fixture(t);
  const root = path.join(repositoryRoot, "examples", "web");
  await write(root, "azure.yaml");
  await write(root, "README.md", REQUIRED_HEADINGS.map((heading) => `## ${heading}`).join("\n"));
  for (const name of GOVERNANCE_FILES) await write(repositoryRoot, name);
  await write(repositoryRoot, ".github/ISSUE_TEMPLATE/bug.yaml", "name: Bug");
  const result = await checkPublication({ root, repositoryRoot, profile: "public-awesome-azd" });
  assert.ok(result.findings.every((finding) => finding.status === "PASS"));
  assert.equal(result.public_stage, "preparation");
  assert.ok(!result.remaining_rules.some((rule) => rule.id === "AZD-AWESOME-006"));
  assert.equal(result.remaining_rules.length, 10);
  assert.ok(result.findings[2].evidence.every((item) => Number.isInteger(item.line)));
  assert.ok(!JSON.stringify(result).includes("name: Bug"));
  const submission = await checkPublication({ root, repositoryRoot, profile: "public-awesome-azd", stage: "submission" });
  assert.ok(submission.remaining_rules.some((rule) => rule.id === "AZD-AWESOME-006"));
});

test("issue config alone is not an issue template; legacy templates are accepted", async (t) => {
  const root = await fixture(t);
  for (const name of GOVERNANCE_FILES) await write(root, name);
  await write(root, ".github/ISSUE_TEMPLATE/config.yml", "blank_issues_enabled: true");
  assert.equal(status(await checkPublication({ root, repositoryRoot: root, profile: "public-awesome-azd" }), "AZD-AWESOME-002"), "FAIL");
  await write(root, ".github/ISSUE_TEMPLATE.md", "Describe the problem");
  assert.equal(status(await checkPublication({ root, repositoryRoot: root, profile: "public-awesome-azd" }), "AZD-AWESOME-002"), "PASS");
});

test("missing nested governance is failure but an unspecified repository root is unknown", async (t) => {
  const root = await fixture(t);
  const options = { root, profile: "public-awesome-azd" };
  assert.equal(status(await checkPublication(options), "AZD-AWESOME-002"), "UNABLE TO DETERMINE");
  assert.equal(status(await checkPublication({ ...options, repositoryRoot: root }), "AZD-AWESOME-002"), "FAIL");
});

test("heading parser excludes code fences, comments, indented code, and other heading levels", () => {
  const content = [
    "```markdown", "## Features", "````", "<!--", "## Resources", "-->",
    "~~~", "## Guidance", "~~~", "    ## Getting Started",
    "### Important Security Notice", "## Features ###", "## Resources",
    "<!-- ## Guidance -->", "## Getting Started",
  ].join("\r\n");
  assert.deepEqual(readH2(content), [
    { title: "Features", line: 12 }, { title: "Resources", line: 13 }, { title: "Getting Started", line: 15 },
  ]);
});

test("headings only at H3 or inside code fail", async (t) => {
  const root = await fixture(t);
  await write(root, "README.md", "```\n" + REQUIRED_HEADINGS.map((heading) => `## ${heading}`).join("\n") + "\n```");
  const result = await checkPublication({ root, profile: "public-awesome-azd" });
  assert.equal(status(result, "AZD-AWESOME-007"), "FAIL");
});

test("comments inside code fences do not hide real headings", () => {
  assert.deepEqual(readH2("```\n<!--\n```\n## Features"), [{ title: "Features", line: 4 }]);
});

test("BOM and invalid backtick fences do not hide real headings", () => {
  assert.deepEqual(readH2("\uFEFF## Features\n```invalid`info\n## Resources"), [
    { title: "Features", line: 1 }, { title: "Resources", line: 3 },
  ]);
});

test("raw HTML is indeterminate rather than a false heading pass", async (t) => {
  const root = await fixture(t);
  await write(root, "README.md", "<pre>\n" + REQUIRED_HEADINGS.map((heading) => `## ${heading}`).join("\n") + "\n</pre>");
  assert.equal(status(await checkPublication({ root, profile: "public-awesome-azd" }), "AZD-AWESOME-007"), "UNABLE TO DETERMINE");
});

test("CommonMark URL and email autolinks do not make valid headings unknown", async (t) => {
  const root = await fixture(t);
  const headings = REQUIRED_HEADINGS.map((heading) => `## ${heading}`).join("\n");
  for (const link of ["<https://example.com>", "<mailto:help@example.com>", "<help+azd@example.com>", "<custom+scheme:resource>"]) {
    await write(root, "README.md", `${link}\n${headings}`);
    assert.equal(status(await checkPublication({ root, profile: "public-awesome-azd" }), "AZD-AWESOME-007"), "PASS", link);
  }
  for (const html of ["<div>", "<pre>", "<https://example.com> <div>", "<user@example.com invalid>", "<a href='https://example.com'>"]) {
    await write(root, "README.md", `${html}\n${headings}`);
    assert.equal(status(await checkPublication({ root, profile: "public-awesome-azd" }), "AZD-AWESOME-007"), "UNABLE TO DETERMINE", html);
  }
});

test("invalid scope and CLI flags are rejected rather than silently defaulted", async (t) => {
  const root = await fixture(t);
  for (const options of [
    { root }, { root, profile: "private" }, { root, profile: "core-only", stage: "submission" },
    { root, profile: "public-awesome-azd", stage: "draft" },
    { root, repositoryRoot: path.join(root, "elsewhere"), profile: "core-only" },
  ]) await assert.rejects(checkPublication(options));
  for (const args of [[], ["--root"], ["--wat", root], ["--root", root, "--root", root]]) {
    const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.ok(result.stderr.trim());
  }
});

test("standalone CLI emits partial JSON without changing target files", async (t) => {
  const root = await fixture(t);
  await write(root, "azure.yaml", "name: example");
  const before = await fs.readFile(path.join(root, "azure.yaml"), "utf8");
  const result = spawnSync(process.execPath, [script, "--root", root, "--profile", "core-only"], { encoding: "utf8", cwd: root });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).findings[0].status, "PASS");
  assert.deepEqual(await fs.readdir(root), ["azure.yaml"]);
  assert.equal(await fs.readFile(path.join(root, "azure.yaml"), "utf8"), before);
});

test("external directory links cannot prove governance present or absent", async (t) => {
  const root = await fixture(t);
  const outside = await fixture(t);
  for (const name of GOVERNANCE_FILES.filter((name) => !name.startsWith(".github/"))) await write(root, name);
  await fs.symlink(outside, path.join(root, ".github"), process.platform === "win32" ? "junction" : "dir");
  assert.equal(status(await checkPublication({ root, repositoryRoot: root, profile: "public-awesome-azd" }), "AZD-AWESOME-002"), "UNABLE TO DETERMINE");
});

test("root junctions cannot import external template evidence", async (t) => {
  const repositoryRoot = await fixture(t);
  const outside = await fixture(t);
  await write(outside, "azure.yaml");
  const root = path.join(repositoryRoot, "template");
  await fs.symlink(outside, root, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(checkPublication({ root, repositoryRoot, profile: "core-only" }), /resolves outside/);
  const unavailable = await checkPublication({
    root: path.join(repositoryRoot, "missing"), repositoryRoot, profile: "core-only",
  });
  assert.equal(status(unavailable, "AZD-CORE-001"), "UNABLE TO DETERMINE");
});

test("repository junctions and contained template roots use canonical paths", async (t) => {
  const parent = await fixture(t);
  const repository = await fixture(t);
  await write(repository, "template/azure.yaml");
  const repositoryRoot = path.join(parent, "repository");
  await fs.symlink(repository, repositoryRoot, process.platform === "win32" ? "junction" : "dir");
  const result = await checkPublication({ root: path.join(repositoryRoot, "template"), repositoryRoot, profile: "core-only" });
  assert.equal(result.repository_root, await fs.realpath(repository));
  assert.equal(result.template_root, await fs.realpath(path.join(repository, "template")));
  assert.equal(status(result, "AZD-CORE-001"), "PASS");
  const canonicalSelection = await checkPublication({
    root: path.join(repository, "template"), repositoryRoot, profile: "core-only",
  });
  assert.equal(status(canonicalSelection, "AZD-CORE-001"), "PASS");
});

test("symlinks outside the selected root and dangling links are evidence gaps", async (t) => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await write(outside, "azure.yaml", "name: outside");
  try {
    await fs.symlink(path.join(outside, "azure.yaml"), path.join(root, "azure.yaml"));
  } catch (error) {
    if (error.code === "EPERM") { t.skip("Creating file symlinks requires OS privileges."); return; }
    throw error;
  }
  assert.equal(status(await checkPublication({ root, profile: "core-only" }), "AZD-CORE-001"), "UNABLE TO DETERMINE");
  await fs.unlink(path.join(root, "azure.yaml"));
  await fs.symlink(path.join(outside, "missing"), path.join(root, "azure.yaml"));
  assert.equal(status(await checkPublication({ root, profile: "core-only" }), "AZD-CORE-001"), "UNABLE TO DETERMINE");
});
