import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function activeTask(root) {
  const indexPath = resolve(root, "docs/phases/index.jsonl");
  if (!existsSync(indexPath)) return null;
  const entries = readFileSync(indexPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  return entries.find((entry) => entry.kind === "task" && entry.status === "in_progress") ?? null;
}

const input = JSON.parse(readFileSync(0, "utf8"));
const task = activeTask(input.cwd);
const context = task
  ? `${task.id} 작업이 진행 중입니다 (검증 방식: ${task.test_mode}). 편집 전 AGENTS.md, 해당 phase 문서, spec_refs를 읽으세요. ${task.test_mode === "tdd" ? "커밋 전 tdd-guard로 단언 실패 RED와 같은 명령의 통과 GREEN을 기록하세요." : "등록된 check_ids를 실행하고 커밋 전 검증 증거를 기록하세요."}`
  : "진행 중인 작업이 없습니다. 구현 전 하나의 작업만 선택해 in_progress로 변경하세요.";

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: context
  }
}));
