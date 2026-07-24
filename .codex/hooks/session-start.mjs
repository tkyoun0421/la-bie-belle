import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runnableIssues } from "../../.agents/harness/scripts/lib/workflow-contract.mjs";

function activeTask(root) {
  const indexPath = resolve(root, "docs/phases/index.jsonl");
  if (!existsSync(indexPath)) return null;
  const entries = readFileSync(indexPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  return entries.find((entry) => entry.kind === "task" && entry.status === "in_progress") ?? null;
}

const input = JSON.parse(readFileSync(0, "utf8"));
const task = activeTask(input.cwd);
const entries = existsSync(resolve(input.cwd, "docs/phases/index.jsonl")) ? readFileSync(resolve(input.cwd, "docs/phases/index.jsonl"), "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
const blockers = task ? runnableIssues(entries, task, input.cwd) : [];
const context = task
  ? `${task.id} 자율 개발 트랙이 진행 중입니다 (검증 방식: ${task.test_mode}). 승인된 범위 안에서 AGENTS.md, 해당 phase 문서와 spec_refs를 따르세요. ${blockers.length ? `공통 계약 차단 사유: ${blockers.map(({ code }) => code).join(", ")}.` : "이중 승인·RADIO 계약이 유효합니다."} ${task.test_mode === "tdd" ? "커밋 전 tdd-guard로 단언 실패 RED와 같은 명령의 통과 GREEN을 기록하세요." : "등록된 check_ids를 실행하고 커밋 전 검증 증거를 기록하세요."} 새 제품 판단은 기획 인터뷰, 새 기술 판단은 RADIO 개발 인터뷰로 반환하세요.`
  : "진행 중인 개발 작업이 없습니다. 제품·프로젝트·개발 설계는 기획·RADIO 개발 인터뷰에서 승인하고, 개발은 승인된 task ID를 사용자가 명시했을 때만 시작하세요. 다음 작업을 자동 선택하지 마세요.";

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: context
  }
}));
