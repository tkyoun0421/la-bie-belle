import { assertExecutionContract, findTask, loadIndex, repoRootFrom, selectNext, validateIndex } from "./lib/index.mjs";
import {
  beginAttempt,
  finishAttempt,
  integrateBlockedTask,
  integrateSuccessfulTask,
  loadHarnessConfig,
  prepareTaskWorktree,
  runCodexAttempt,
  validateSuccessfulTask
} from "./lib/orchestrator.mjs";

const root = repoRootFrom(import.meta.url);
const args = process.argv.slice(2);
const indexArgument = args.includes("--index") ? args[args.indexOf("--index") + 1] : undefined;
if (args.includes("--index") && !indexArgument) throw new Error("--index에는 경로가 필요합니다");
if (args.includes("--execute") && indexArgument) throw new Error("--index는 테스트 전용이므로 --execute와 함께 사용할 수 없습니다");
const { entries } = loadIndex(root, indexArgument);
const errors = validateIndex(entries);
if (errors.length) throw new Error(errors.join("; "));
const task = args.includes("--task") ? assertExecutionContract(findTask(entries, args[args.indexOf("--task") + 1])) : selectNext(entries);
if (!task) { console.log(JSON.stringify({ status: "idle", reason: "no runnable task" })); process.exit(0); }
if (!["planned", "in_progress"].includes(task.status)) throw new Error(`${task.id}: 실행기는 planned 또는 in_progress 상태가 필요합니다. 현재 상태: ${task.status}`);
console.log(JSON.stringify({ status: "selected", task_id: task.id, title: task.title, test_mode: task.test_mode, check_ids: task.check_ids }, null, 2));
if (!args.includes("--execute")) process.exit(0);
const config = loadHarnessConfig(root);
const state = prepareTaskWorktree(root, task, config);
while (state.attempts.length < state.max_attempts) {
  const attempt = beginAttempt(root, state);
  const result = runCodexAttempt(root, task, state, attempt);
  if (result.exitCode !== 0) {
    finishAttempt(root, state, attempt, { exitCode: result.exitCode, outcome: "codex_failed", error: result.error });
    continue;
  }
  try {
    const success = validateSuccessfulTask(task, state);
    finishAttempt(root, state, attempt, { exitCode: 0, outcome: "passed" });
    const integratedCommit = integrateSuccessfulTask(root, state, success);
    console.log(JSON.stringify({ status: "done", task_id: task.id, attempts: state.attempts.length, commit: integratedCommit }, null, 2));
    process.exit(0);
  } catch (error) {
    finishAttempt(root, state, attempt, { exitCode: 1, outcome: "validation_failed", error: error.message });
  }
}
const blockedCommit = integrateBlockedTask(root, task, state);
console.error(JSON.stringify({
  status: "blocked",
  task_id: task.id,
  attempts: state.attempts.length,
  commit: blockedCommit,
  worktree: state.worktree_path
}, null, 2));
process.exit(1);
