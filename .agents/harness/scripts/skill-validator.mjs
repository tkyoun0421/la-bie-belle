import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertSkillLanguage } from "./lib/skill-language.mjs";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const skills = [
  {
    name: "la-bie-belle-product-interview",
    required: ["한 차례에 결정 주제 하나", "2~3개 선택지", "명시적으로 확인", "`design_pending`"]
  },
  {
    name: "la-bie-belle-development-interview",
    required: ["Requirements, Architecture, Data model, Interface, Optimizations", "`DEV-*`", "SHA-256", "`planned`"]
  },
  {
    name: "la-bie-belle-harness",
    required: ["자율 개발 루프", "RADIO", "TDD", "커밋", "다음 작업을 선택하거나 시작하지"]
  }
];
assertSkillLanguage(resolve(root, ".agents/skills"));
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
if (existsSync(resolve(root, ".agents/skills/la-bie-belle-deep-interview"))) {
  throw new Error("스킬 검사기: 전환 완료 후 기존 통합 딥인터뷰 스킬은 없어야 합니다");
}
console.log("repository-local 스킬 구조와 한국어 언어 검사를 통과했습니다");
