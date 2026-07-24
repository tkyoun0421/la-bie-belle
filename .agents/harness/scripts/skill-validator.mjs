import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const skills = [
  {
    name: "la-bie-belle-deep-interview",
    required: ["Run the interview loop", "explicit approval", "planned", "Do not mark a task `in_progress`"]
  },
  {
    name: "la-bie-belle-harness",
    required: ["Autonomous Engineering Loop", "RADIO", "TDD", "commit", "Never select the next task automatically"]
  }
];
for (const definition of skills) {
  const path = resolve(root, `.agents/skills/${definition.name}/SKILL.md`);
  const metadataPath = resolve(root, `.agents/skills/${definition.name}/agents/openai.yaml`);
  if (!existsSync(path)) throw new Error(`스킬 검사기: 저장소 로컬 스킬이 없습니다: ${definition.name}`);
  if (!existsSync(metadataPath)) throw new Error(`스킬 검사기: 스킬 메타데이터가 없습니다: ${definition.name}`);
  const skill = readFileSync(path, "utf8");
  for (const required of [`name: ${definition.name}`, ...definition.required]) {
    if (!skill.includes(required)) throw new Error(`스킬 검사기: ${definition.name}에 필수 항목이 없습니다: ${required}`);
  }
  if (skill.includes("[TODO:")) throw new Error(`스킬 검사기: ${definition.name}에 해결되지 않은 템플릿 TODO가 있습니다`);
  const metadata = readFileSync(metadataPath, "utf8");
  for (const required of ["display_name:", "short_description:", "default_prompt:", `$${definition.name}`]) {
    if (!metadata.includes(required)) throw new Error(`스킬 검사기: ${definition.name} 메타데이터에 필수 항목이 없습니다: ${required}`);
  }
}
console.log("딥인터뷰와 자율 개발 스킬 검사를 통과했습니다");
