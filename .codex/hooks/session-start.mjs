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
  ? `${task.id} 자율 개발 트랙이 진행 중입니다 (검증 방식: ${task.test_mode}). 승인된 범위 안에서 AGENTS.md, 해당 phase 문서와 spec_refs를 따르세요. ${task.test_mode === "tdd" ? "커밋 전 tdd-guard로 단언 실패 RED와 같은 명령의 통과 GREEN을 기록하세요." : "등록된 check_ids를 실행하고 커밋 전 검증 증거를 기록하세요."} 새 설계 결정이 필요하면 딥인터뷰 트랙으로 반환하세요.`
  : "진행 중인 개발 작업이 없습니다. 제품·프로젝트·개발 설계는 딥인터뷰 트랙에서 승인하고, 개발은 승인된 task ID를 사용자가 명시했을 때만 시작하세요. 다음 작업을 자동 선택하지 마세요.";

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: context
  }
}));
