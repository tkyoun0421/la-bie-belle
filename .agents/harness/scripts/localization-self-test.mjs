import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { repoRootFrom } from "./lib/index.mjs";

const root = repoRootFrom(import.meta.url);

function harnessScriptPaths(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return harnessScriptPaths(path);
    return entry.isFile() && entry.name.endsWith(".mjs") ? [path] : [];
  });
}

for (const path of harnessScriptPaths(join(root, ".agents/harness/scripts"))) {
  const source = readFileSync(path, "utf8");
  const messages = source.matchAll(/(?:throw new Error|console\.error)\(\s*(["'])(.*?)\1/g);
  for (const match of messages) {
    if (!/[가-힣]/.test(match[2])) throw new Error(`하네스 오류 문구는 한국어여야 합니다: ${path}`);
  }
}

const hooks = JSON.parse(readFileSync(join(root, ".codex/hooks.json"), "utf8"));
for (const message of hooks.hooks.SessionStart.flatMap((entry) => entry.hooks).map((hook) => hook.statusMessage)) {
  if (!/[가-힣]/.test(message)) throw new Error("Codex 훅 상태 메시지는 한국어여야 합니다");
}
const session = spawnSync("node", [".codex/hooks/session-start.mjs"], { cwd: root, input: JSON.stringify({ cwd: root }), encoding: "utf8" });
if (session.status !== 0) throw new Error(session.stderr || "시작 훅을 실행할 수 없습니다");
const context = JSON.parse(session.stdout).hookSpecificOutput?.additionalContext ?? "";
if (!/[가-힣]/.test(context)) throw new Error("시작 훅 안내 문구는 한국어여야 합니다");
const preToolUse = readFileSync(join(root, ".codex/hooks/pre-tool-use.mjs"), "utf8");
if (!preToolUse.includes("커밋을 차단했습니다") || !preToolUse.includes("TDD 작업입니다")) throw new Error("커밋 훅의 한국어 안내 문구가 누락되었습니다");
console.log("한국어 문구 자체 검사를 통과했습니다");
