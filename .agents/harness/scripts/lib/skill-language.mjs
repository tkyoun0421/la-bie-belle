import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const USER_FACING_FIELDS = ["display_name", "short_description", "default_prompt"];
const KOREAN_PATTERN = /[가-힣]/;

function skillMarkdownPaths(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return skillMarkdownPaths(path);
    return entry.isFile() && entry.name === "SKILL.md" ? [path] : [];
  });
}

function markdownBody(source) {
  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return match ? source.slice(match[0].length) : source;
}

function metadataFields(source) {
  const fields = new Map();
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(display_name|short_description|default_prompt):\s*(.*?)\s*$/);
    if (!match) continue;
    fields.set(match[1], match[2].replace(/^(['"])(.*)\1$/, "$2"));
  }
  return fields;
}

function displayPath(path, root) {
  const pathFromRoot = relative(root, path);
  return pathFromRoot || path;
}

export function skillLanguageErrors(skillsRoot) {
  const errors = [];
  for (const skillPath of skillMarkdownPaths(skillsRoot)) {
    const skillDirectory = dirname(skillPath);
    const skillDisplayPath = displayPath(skillPath, skillsRoot);
    const skill = readFileSync(skillPath, "utf8");
    if (!KOREAN_PATTERN.test(markdownBody(skill))) {
      errors.push(`${skillDisplayPath}: SKILL.md 본문에 한국어 안내가 없습니다. 사용자용 설명과 절차를 한국어로 작성하세요.`);
    }

    const metadataPath = join(skillDirectory, "agents/openai.yaml");
    const metadataDisplayPath = displayPath(metadataPath, skillsRoot);
    if (!existsSync(metadataPath)) {
      errors.push(`${metadataDisplayPath}: 스킬 메타데이터가 없습니다. agents/openai.yaml을 만들고 사용자 노출 필드를 한국어로 작성하세요.`);
      continue;
    }
    const fields = metadataFields(readFileSync(metadataPath, "utf8"));
    for (const field of USER_FACING_FIELDS) {
      const value = fields.get(field);
      if (!value) {
        errors.push(`${metadataDisplayPath}: ${field} 필드가 없습니다. 해당 사용자 노출 필드를 한국어로 작성하세요.`);
      } else if (!KOREAN_PATTERN.test(value)) {
        errors.push(`${metadataDisplayPath}: ${field} 필드에 한국어 안내가 없습니다. 영문 식별자는 유지하고 사용자용 문구를 한국어로 작성하세요.`);
      }
    }
  }
  return errors;
}

export function assertSkillLanguage(skillsRoot) {
  const errors = skillLanguageErrors(skillsRoot);
  if (errors.length) throw new Error(`스킬 한국어 언어 가드가 실패했습니다:\n${errors.join("\n")}`);
}
