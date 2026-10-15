import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspect } from "./file-facts.mjs";

// Deliberately no YAML parser or service detection. azd owns detection; the
// agent interprets semantics after inspecting configuration and source.
export async function inspectProject({ root }) {
  if (!root) throw new Error("An explicit --root is required.");
  root = path.resolve(root);
  const selected = [
    ["azure.yaml", false], [".azure", true], [".gitignore", false],
    ["infra", true],
  ];
  const facts = await Promise.all(selected.map(async ([name, directory]) => {
    const { content, entries, ...fact } = await inspect(root, name, directory, { readContent: false });
    return { ...fact, role: name === "infra" ? "conventional infrastructure location; optional" : "setup" };
  }));
  const listing = await inspect(root, ".", true);
  const manifestNames = listing.state === "present"
    ? listing.entries.filter((name) => /^(package\.json|.*\.(csproj|sln|fsproj)|pyproject\.toml|requirements\.txt|go\.mod|pom\.xml|build\.gradle(\.kts)?|Cargo\.toml|Makefile|Dockerfile)$/i.test(name)).sort()
    : [];
  const config = facts[0].state;
  return {
    format_version: 1,
    assessment: "project-diagnostics",
    project_root: root,
    facts,
    root_build_manifests: manifestNames,
    root_listing: listing.state,
    gaps: [
      ...(config === "missing" ? ["No azure.yaml at the selected root; initialization is not established."] : []),
      ...(config === "unknown" ? ["Configuration could not be inspected; setup state is unknown."] : []),
      ...(facts[1].state === "missing" ? ["No local .azure directory; local environment selection is not established."] : []),
    ],
    limitations: [
      "File presence only; no YAML/schema validation, service detection, or infrastructure path resolution.",
      "Missing conventional infra is not a failure; existing-code initialization need not check in infrastructure.",
      "Origin, initialization completeness, deployment, publication readiness, and acceptance are not inferred.",
      "Root manifest names only, not recursive build discovery. Inspect hooks, referenced scripts and build tools before azd execution.",
      "Read-only: no target execution, cloud operations, network access, or publication policy checks.",
    ],
  };
}

function argumentsFor(argv) {
  if (argv.length !== 2 || argv[0] !== "--root" || !argv[1] || argv[1].startsWith("--")) {
    throw new Error("Usage: node inspect-project.mjs --root <project>");
  }
  return { root: argv[1] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(await inspectProject(argumentsFor(process.argv.slice(2))), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
