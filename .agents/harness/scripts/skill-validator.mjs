import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const path = resolve(root, ".agents/skills/la-bie-belle-harness/SKILL.md");
const metadataPath = resolve(root, ".agents/skills/la-bie-belle-harness/agents/openai.yaml");
if (!existsSync(path)) throw new Error("스킬 검사기: 저장소 로컬 하네스 스킬이 없습니다");
if (!existsSync(metadataPath)) throw new Error("스킬 검사기: 스킬 메타데이터가 없습니다");
const skill = readFileSync(path, "utf8");
for (const required of ["name: la-bie-belle-harness", "## Workflow", "RADIO", "TDD", "commit"]) {
  if (!skill.includes(required)) throw new Error(`스킬 검사기: 필수 항목이 없습니다: ${required}`);
}
if (skill.includes("[TODO:")) throw new Error("스킬 검사기: 해결되지 않은 템플릿 TODO가 있습니다");
const metadata = readFileSync(metadataPath, "utf8");
for (const required of ["display_name:", "short_description:", "default_prompt:"]) {
  if (!metadata.includes(required)) throw new Error(`스킬 검사기: 메타데이터 필수 항목이 없습니다: ${required}`);
}
console.log("스킬 검사를 통과했습니다");
