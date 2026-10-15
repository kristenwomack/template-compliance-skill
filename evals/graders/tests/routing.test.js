import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import YAML from "yaml";
import { loadLegacyTasks, loadStimuli } from "../../parity/legacy-parity.js";

const skill = new URL("../../../skills/azd/", import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, skill), "utf8");

describe("azd router and workflow boundaries", () => {
  it("keeps the entry point thin, named azd, and routes to all four on-demand references", () => {
    const text = read("SKILL.md");
    const frontmatter = YAML.parse(text.split("---")[1]);
    assert.equal(frontmatter.name, "azd");
    assert.ok(text.length / 4 < 1000, "entry point exceeds approximate token budget");
    assert.match(text, /Load only the selected workflow/);
    assert.doesNotMatch(text, /policy\/publication-catalog/);
    for (const workflow of ["build", "operate", "check", "publish"]) {
      assert.ok(text.includes(`references/${workflow}.md`));
      assert.ok(read(`references/${workflow}.md`).length / 4 < 1000, `${workflow} exceeds approximate token budget`);
    }
  });

  it("makes scripts, help, execution risks, and authorization explicit", () => {
    const text = read("SKILL.md");
    for (const phrase of ["azd version", "--help", "hooks", "build tools", "Cloud-changing", "teardown", "never implicit"]) {
      assert.ok(text.includes(phrase), `missing ${phrase}`);
    }
    const build = read("references/build.md");
    for (const phrase of ["Scan current directory", "--template", "--minimal", "separate terminal agent session", "explicit approval", "without checked-in infrastructure"]) {
      assert.ok(build.includes(phrase), `missing ${phrase}`);
    }
  });

  it("keeps project checks separate from stricter publication and preserves read-only review", () => {
    assert.match(read("references/check.md"), /Do not load that catalog/);
    assert.match(read("references/publish.md"), /read-only/);
    assert.match(read("references/publish.md"), /remaining_rules/);
    assert.match(read("references/publish.md"), /on demand/);
    assert.match(read("references/policy-profiles.md"), /only to explicitly requested template publication/);
  });

  it("keeps new journey prompts, staged files, assertions and no-report expectations synchronized", () => {
    const { stimuli } = loadStimuli();
    const journeys = loadLegacyTasks().filter((task) => task.expected?.report === false);
    assert.equal(journeys.length, 8);
    for (const task of journeys) {
      const stimulus = stimuli.find((entry) => entry.name === task.id);
      assert.equal(stimulus.prompt, task.prompt);
      assert.deepEqual(stimulus.rubric, task.expected.assertions);
      assert.equal(stimulus.graders.find((grader) => grader.type === "publication-report").config.expect_report, false);
      assert.ok(stimulus.graders.some((grader) => grader.type === "diff-empty"));
      assert.deepEqual(stimulus.agent_environment.files.map((entry) => `evals/${entry.src}`).sort(), [...task.fixture.evidence_files].sort());
    }
  });

  it("requires explicit template destination and version/help confirmation", () => {
    const build = read("references/build.md");
    assert.ok(build.includes("azd init --template <selected-template> ."));
    for (const phrase of ["template-named directory", "absolute destination", "command working", "azd init --help", "--cwd"]) {
      assert.ok(build.includes(phrase), phrase);
    }
    const readme = fs.readFileSync(new URL("../../../README.md", import.meta.url), "utf8");
    assert.ok(readme.includes("azd init --template <selected-template> ."));
    assert.match(read("references/init-sources.md"), /c681d5a9e52961914e12e98255680363c52e2a7f/);
  });
});
