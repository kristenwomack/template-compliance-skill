import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const skill = new URL("../skills/template-compliance/", import.meta.url);
const catalog = JSON.parse(await fs.readFile(new URL("catalog.json", skill), "utf8"));
const check = process.argv.includes("--check");
let stale = false;
for (const module of catalog.modules) {
  const rules = module.rule_ids.map((id) => {
    const rule = catalog.rules.find((entry) => entry.id === id);
    if (!rule) throw new Error(`Unknown catalog rule ${id}`);
    return rule;
  });
  const text = `${module.introduction}\n\n<!-- Generated from catalog.json; run npm run catalog:generate. Do not edit. -->\n\n\`\`\`yaml\n${YAML.stringify({ rules }, { lineWidth: 0 })}\`\`\`\n`;
  const target = new URL(`references/${module.file}`, skill);
  if (check) {
    if ((await fs.readFile(target, "utf8")).replace(/\r\n/g, "\n") !== text) {
      console.error(`Stale generated catalog: ${fileURLToPath(target)}`);
      stale = true;
    }
  } else {
    await fs.writeFile(target, text);
  }
}
if (stale) process.exitCode = 1;
