import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSkillLanguage, skillLanguageErrors } from "./lib/skill-language.mjs";

function writeSkill(root, name, { body = "한국어 사용자 안내입니다.", metadata = {} } = {}) {
  const skillDirectory = join(root, name);
  mkdirSync(join(skillDirectory, "agents"), { recursive: true });
  writeFileSync(join(skillDirectory, "SKILL.md"), `---\nname: ${name}\ndescription: fixture\n---\n\n${body}\n`);
  const values = {
    display_name: "검사용 스킬",
    short_description: "한국어 스킬 설명을 검사합니다",
    default_prompt: `$${name}을 사용해 한국어 안내를 검사하세요.`,
    ...metadata
  };
  const lines = ["interface:"];
  for (const [field, value] of Object.entries(values)) {
    if (value !== undefined) lines.push(`  ${field}: ${JSON.stringify(value)}`);
  }
  writeFileSync(join(skillDirectory, "agents/openai.yaml"), `${lines.join("\n")}\n`);
}

function expectError(errors, pattern, label) {
  if (!errors.some((error) => pattern.test(error))) {
    throw new Error(`${label} fixture의 예상 오류를 찾지 못했습니다: ${errors.join(" | ")}`);
  }
}

const fixtureRoot = mkdtempSync(join(tmpdir(), "skill-language-guard-"));
const localSkills = join(fixtureRoot, ".agents", "skills");
mkdirSync(localSkills, { recursive: true });

writeSkill(localSkills, "valid-skill", {
  body: "한국어 안내 뒤에 영문 식별자, `$valid-skill`, `node script.mjs` 명령과 코드 예시를 사용할 수 있습니다."
});
assertSkillLanguage(localSkills);

writeSkill(localSkills, "english-body", { body: "Use this skill with node script.mjs." });
expectError(skillLanguageErrors(localSkills), /english-body\/SKILL\.md.*한국어 안내가 없습니다/, "영문 전용 본문");

writeSkill(localSkills, "missing-field", { metadata: { short_description: undefined } });
expectError(skillLanguageErrors(localSkills), /missing-field\/agents\/openai\.yaml.*short_description 필드가 없습니다/, "필드 누락");

writeSkill(localSkills, "english-field", { metadata: { default_prompt: "Use $english-field to validate skills." } });
expectError(skillLanguageErrors(localSkills), /english-field\/agents\/openai\.yaml.*default_prompt 필드에 한국어 안내가 없습니다/, "영문 전용 필드");

const isolatedSkills = join(fixtureRoot, "isolated", ".agents", "skills");
const externalSkills = join(fixtureRoot, "external", "skills");
mkdirSync(isolatedSkills, { recursive: true });
mkdirSync(externalSkills, { recursive: true });
writeSkill(isolatedSkills, "local-valid");
writeSkill(externalSkills, "external-invalid", { body: "English only." });
assertSkillLanguage(isolatedSkills);

console.log("스킬 한국어 언어 가드 자체 검사를 통과했습니다");
