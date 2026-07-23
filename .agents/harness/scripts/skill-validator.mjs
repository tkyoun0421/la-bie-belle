import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const path = resolve(root, ".agents/skills/la-bie-belle-harness/SKILL.md");
const metadataPath = resolve(root, ".agents/skills/la-bie-belle-harness/agents/openai.yaml");
if (!existsSync(path)) throw new Error("skill validator: repository-local harness skill is missing");
if (!existsSync(metadataPath)) throw new Error("skill validator: skill metadata is missing");
const skill = readFileSync(path, "utf8");
for (const required of ["name: la-bie-belle-harness", "## Workflow", "RADIO", "TDD", "commit"]) {
  if (!skill.includes(required)) throw new Error(`skill validator: missing ${required}`);
}
if (skill.includes("[TODO:")) throw new Error("skill validator: unresolved template TODO");
const metadata = readFileSync(metadataPath, "utf8");
for (const required of ["display_name:", "short_description:", "default_prompt:"]) {
  if (!metadata.includes(required)) throw new Error(`skill validator: metadata missing ${required}`);
}
console.log("skill validator ok");
