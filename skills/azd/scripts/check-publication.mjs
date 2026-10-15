import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contained, inspect } from "./file-facts.mjs";

const CATALOG = JSON.parse(await fs.readFile(new URL("../policy/publication-catalog.json", import.meta.url), "utf8"));
export const REQUIRED_HEADINGS = CATALOG.required_headings;
export const GOVERNANCE_FILES = CATALOG.governance_files;
const PROFILES = ["core-only", "public-awesome-azd", "organization-catalog", "unresolved"];

export function readH2(content) {
  const headings = [];
  let fence;
  let comment = false;
  for (const [index, original] of content.replace(/^\uFEFF/, "").split(/\r?\n/).entries()) {
    if (fence) {
      const closing = original.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (closing && closing[1][0] === fence[0] && closing[1].length >= fence.length) fence = undefined;
      continue;
    }
    let line = original.replace(/<!--[\s\S]*?-->/g, "");
    if (comment) {
      const end = line.indexOf("-->");
      if (end < 0) continue;
      line = line.slice(end + 3);
      comment = false;
    }
    const start = line.indexOf("<!--");
    if (start >= 0) {
      line = line.slice(0, start);
      comment = true;
    }
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker && !(marker[1][0] === "`" && marker[2].includes("`"))) {
      fence = marker[1];
      continue;
    }
    const heading = line.match(/^ {0,3}##[ \t]+(.+?)\s*$/);
    if (heading) headings.push({ title: heading[1].replace(/[ \t]+#+[ \t]*$/, ""), line: index + 1 });
  }
  return headings;
}

function finding(id, layer, evidence, rationale) {
  const status = evidence.some((item) => item.state === "missing") ? "FAIL"
    : evidence.some((item) => item.state === "unknown") ? "UNABLE TO DETERMINE" : "PASS";
  const rule = CATALOG.rules.find((entry) => entry.id === id);
  return {
    id, layer, title: rule.title, status,
    evidence: evidence.map(({ content, entries, ...item }) => item), rationale,
    policy_basis: {
      version: rule.version, requirement: rule.requirement, requirement_kind: rule.requirement_kind,
      source_revision: rule.source_revision, references: rule.references,
    },
    ...(status === "FAIL" ? { remediation: rule.remediation } : {}),
    ...(status === "UNABLE TO DETERMINE" || id === "AZD-AWESOME-007"
      ? { reconciliation_criteria: { inspect: rule.inspect, pass: rule.pass, fail: rule.fail, unknown: rule.unknown } } : {}),
  };
}

export async function checkPublication({ root, repositoryRoot, profile, stage }) {
  if (!root || !PROFILES.includes(profile)) throw new Error("An explicit --root and valid --profile are required.");
  if (stage && (profile !== "public-awesome-azd" || !["preparation", "submission"].includes(stage))) {
    throw new Error("--stage is preparation or submission and is valid only for public-awesome-azd.");
  }
  root = path.resolve(root);
  if (repositoryRoot) {
    repositoryRoot = path.resolve(repositoryRoot);
    if (!contained(repositoryRoot, root)) throw new Error("--root must be inside --repository-root.");
  }
  const publicStage = profile === "public-awesome-azd" ? stage ?? "preparation" : undefined;
  const selected = CATALOG.rules.filter((rule) => rule.status === "active" && rule.policy_kind === "approved"
    && (rule.layer === "core" || (publicStage && rule.stages.includes(publicStage))));
  const selectedRule = (id) => selected.some((rule) => rule.id === id);
  const findings = [];
  if (selectedRule("AZD-CORE-001")) {
    findings.push(finding("AZD-CORE-001", "core", [await inspect(root, "azure.yaml")], "azure.yaml must be a readable file at the selected template root."));
  }
  if (selectedRule("AZD-AWESOME-002")) {
    const governance = repositoryRoot
      ? await Promise.all(GOVERNANCE_FILES.map((name) => inspect(repositoryRoot, name)))
      : [{ path: null, state: "unknown", reason: "Repository root was not explicitly supplied." }];
    if (repositoryRoot) {
      const legacy = await inspect(repositoryRoot, ".github/ISSUE_TEMPLATE.md");
      const directory = await inspect(repositoryRoot, ".github/ISSUE_TEMPLATE", true);
      const templates = directory.state === "present"
        ? await Promise.all(directory.entries.filter((name) => /\.(md|ya?ml)$/i.test(name) && !/^config\.ya?ml$/i.test(name))
          .map((name) => inspect(repositoryRoot, `.github/ISSUE_TEMPLATE/${name}`)))
        : [];
      const present = [legacy, ...templates].find((item) => item.state === "present");
      const unknown = [legacy, directory, ...templates].find((item) => item.state === "unknown");
      governance.push(present ?? unknown ?? {
        path: directory.path, state: "missing", reason: "Readable listings contain no issue template (config.yml is not a template).",
      });
    }
    findings.push(finding("AZD-AWESOME-002", "destination", governance, "Repository-scoped governance files and at least one issue template must be present."));
  }
  if (selectedRule("AZD-AWESOME-007")) {
    const readme = await inspect(root, "README.md");
    const headings = readme.state === "present" ? readH2(readme.content) : [];
    const unsupportedHtml = readme.state === "present"
      && /^ {0,3}<\/?[A-Za-z][^>]*>/m.test(readme.content.replace(/<!--[\s\S]*?-->/g, ""));
    const evidence = unsupportedHtml
      ? [{ path: readme.path, state: "unknown", reason: "Raw HTML may affect Markdown heading structure; inspect manually." }]
      : readme.state === "present" ? REQUIRED_HEADINGS.map((title) => {
        const match = headings.find((heading) => heading.title === title);
        return { path: readme.path, heading: title, state: match ? "present" : "missing", ...(match ? { line: match.line } : { reason: "Required literal H2 heading absent." }) };
      }) : [readme];
    findings.push(finding("AZD-AWESOME-007", "destination", evidence, "Each required literal H2 heading must occur outside fenced code and HTML comments; raw HTML requires manual inspection."));
  }
  return {
    format_version: 2,
    catalog: CATALOG.identity,
    policy_baseline: CATALOG.baseline,
    template_root: root,
    repository_root: repositoryRoot ?? null,
    destination_profile: profile,
    ...(publicStage ? { public_stage: publicStage } : {}),
    findings,
    remaining_rules: selected.filter((rule) => !findings.some((item) => item.id === rule.id))
      .map(({ id, title, layer, version, requirement, applies, inspect, pass, fail, unknown, remediation, requirement_kind, source_revision, references }) =>
        ({ id, title, layer, version, requirement, applies, inspect, pass, fail, unknown, remediation, requirement_kind, source_revision, references })),
    safeguards: [...CATALOG.safeguards.core, ...(publicStage ? CATALOG.safeguards.public : [])],
    ...(publicStage ? { required_headings: REQUIRED_HEADINGS, required_repository_topics: CATALOG.required_repository_topics } : {}),
    organization_requirements: profile === "organization-catalog" ? "Assess only the user's explicitly selected existing documents." : "Not assessed.",
    limitations: [
      "Partial static checks only; not an overall compliance verdict.",
      "No schema validation, tracked-file checks, deployment, teardown, network access, or target execution.",
      "Record the audited revision separately; reconcile supplied validation records and access restrictions before reporting.",
    ],
  };
}

function argumentsFor(argv) {
  const names = { "--root": "root", "--repository-root": "repositoryRoot", "--profile": "profile", "--stage": "stage" };
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = names[argv[i]];
    if (!key || options[key] !== undefined || !argv[i + 1] || argv[i + 1].startsWith("--")) {
      throw new Error("Usage: node check-publication.mjs --root <template> --profile <profile> [--repository-root <repository>] [--stage preparation|submission]");
    }
    options[key] = argv[i + 1];
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(await checkPublication(argumentsFor(process.argv.slice(2))), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
