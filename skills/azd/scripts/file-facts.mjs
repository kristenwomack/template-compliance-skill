import fs from "node:fs/promises";
import path from "node:path";

export function contained(root, target) {
  const relative = path.relative(root, target);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export async function inspect(root, relative, directory = false, { readContent = true } = {}) {
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
    return {
      path: target, state: "present",
      ...(readContent ? { content: await fs.readFile(target, "utf8") } : {}),
    };
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
