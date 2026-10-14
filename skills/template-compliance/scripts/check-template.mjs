import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_HEADINGS = [
  "Important Security Notice", "Features", "Getting Started", "Guidance", "Resources",
];
export const GOVERNANCE_FILES = [
  "LICENSE.md", "SECURITY.md", "CONTRIBUTING.md", ".github/CODE_OF_CONDUCT.md",
];
const CORE = Array.from({ length: 6 }, (_, i) => `AZD-CORE-00${i + 1}`);
const PUBLIC = Array.from({ length: 8 }, (_, i) => `AZD-AWESOME-00${i + 1}`);
const PROFILES = ["core-only", "public-awesome-azd", "organization-catalog", "unresolved"];

function contained(root, target) {
  const relative = path.relative(root, target);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function inspect(root, relative, directory = false) {
  const target = path.resolve(root, relative);
  let realRoot;
  try {
    realRoot = await fs.realpath(root);
    await fs.readdir(root);
  } catch (error) {
    return { path: target, state: "unknown", reason: `Selected root listing unavailable (${error.code ?? error.name}).` };
  }
  try {
    // Inspect each ancestor so an external symlink cannot prove a file absent.
    let current = root;
    for (const part of relative.split("/")) {
      current = path.join(current, part);
      const real = await fs.realpath(current);
      if (!contained(realRoot, real)) {
        return { path: target, state: "unknown", reason: "Symlink resolves outside the selected root." };
      }
    }
    const stat = await fs.stat(target);
    if (directory ? !stat.isDirectory() : !stat.isFile()) {
      return { path: target, state: "missing", reason: `Required ${directory ? "directory" : "file"} is not present.` };
    }
    if (directory) {
      return { path: target, state: "present", entries: await fs.readdir(target) };
    }
    const content = await fs.readFile(target, "utf8");
    return { path: target, state: "present", content };
  } catch (error) {
    if (error.code === "ENOENT") {
      // A readable parent listing distinguishes absence from a dangling link.
      try {
        let missing = target;
        while (true) {
          const parent = path.dirname(missing);
          const name = path.basename(missing);
          let entries;
          try {
            entries = await fs.readdir(parent);
          } catch (error) {
            if (error.code === "ENOENT" && contained(root, parent) && parent !== root) {
              missing = parent;
              continue;
            }
            throw error;
          }
          if (entries.includes(name)) {
            return { path: target, state: "unknown", reason: "Existing path could not be resolved." };
          }
          return { path: target, state: "missing", reason: `Readable listing of ${parent} proves ${name} absent.` };
        }
      } catch (parentError) {
        return { path: target, state: "unknown", reason: `Parent listing unavailable (${parentError.code}).` };
      }
    }
    return { path: target, state: "unknown", reason: `Evidence unavailable (${error.code ?? error.name}).` };
  }
}

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
  return { id, layer, status, evidence: evidence.map(({ content, entries, ...item }) => item), rationale };
}

export async function checkTemplate({ root, repositoryRoot, profile, stage }) {
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
  const selected = [...CORE, ...(publicStage ? PUBLIC.filter((id) => publicStage === "submission" || id !== "AZD-AWESOME-006") : [])];
  const findings = [
    finding("AZD-CORE-001", "core", [await inspect(root, "azure.yaml")], "azure.yaml must be a readable file at the selected template root."),
  ];
  if (publicStage) {
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
    format_version: 1,
    catalog: "template-compliance@4",
    template_root: root,
    repository_root: repositoryRoot ?? null,
    destination_profile: profile,
    ...(publicStage ? { public_stage: publicStage } : {}),
    findings,
    remaining_rule_ids: selected.filter((id) => !findings.some((item) => item.id === id)),
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
      throw new Error("Usage: node check-template.mjs --root <template> --profile <profile> [--repository-root <repository>] [--stage preparation|submission]");
    }
    options[key] = argv[i + 1];
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(await checkTemplate(argumentsFor(process.argv.slice(2))), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
