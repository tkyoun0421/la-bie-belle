import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const requiredFiles = [
  "docs/DEVELOPMENT.md",
  "docs/adr/0008-fsd-server-first-development-guards.md",
  ".codex/hooks.json",
  ".codex/hooks/session-start.mjs",
  ".codex/hooks/pre-tool-use.mjs"
];
const requiredDevelopmentHeadings = ["## FSD와 서버 경계", "## 인터페이스와 데이터", "## server-first와 TanStack Query", "## RADIO와 검증"];
const requiredRadioHeadings = ["## Requirements", "## Architecture", "## Data model", "## Interface", "## Optimizations"];

for (const path of requiredFiles) {
  if (!existsSync(resolve(root, path))) throw new Error(`개발 가드: ${path} 파일이 없습니다`);
}
const development = readFileSync(resolve(root, "docs/DEVELOPMENT.md"), "utf8");
for (const heading of requiredDevelopmentHeadings) {
  if (!development.includes(heading)) throw new Error(`개발 가드: ${heading} 항목이 없습니다`);
}
for (const heading of requiredRadioHeadings) {
  if (!development.includes(heading)) throw new Error(`개발 가드: RADIO 템플릿에 ${heading} 항목이 없습니다`);
}
const hooks = JSON.parse(readFileSync(resolve(root, ".codex/hooks.json"), "utf8"));
if (!Array.isArray(hooks.hooks?.PreToolUse) || !Array.isArray(hooks.hooks?.SessionStart)) {
  throw new Error("개발 가드: Codex SessionStart와 PreToolUse 훅이 필요합니다");
}
const hookText = readFileSync(resolve(root, ".codex/hooks/pre-tool-use.mjs"), "utf8");
if (!hookText.includes("pre-commit.mjs") || !hookText.includes("tdd-guard")) {
  throw new Error("개발 가드: Codex 훅은 커밋과 TDD 규칙을 강제해야 합니다");
}
console.log("개발 가드를 통과했습니다");
