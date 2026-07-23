import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { findTask, loadIndex, validateIndex } from "./index.mjs";

function git(cwd, args, options = {}) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    env: options.env ? { ...process.env, ...options.env } : process.env
  });
  if (!options.allowFailure && result.status !== 0) {
    throw new Error(`${cwd}에서 git ${args.join(" ")} 명령이 실패했습니다\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  }
  return result;
}

export function gitOutput(cwd, args) {
  return git(cwd, args).stdout.trim();
}

export function loadHarnessConfig(root) {
  const config = JSON.parse(readFileSync(join(root, ".agents/harness/config.json"), "utf8"));
  if (!Number.isInteger(config.max_attempts) || config.max_attempts < 1) {
    throw new Error("하네스 설정의 max_attempts는 양의 정수여야 합니다");
  }
  return config;
}

export function ensureCleanIntegration(root) {
  const changes = gitOutput(root, ["status", "--porcelain"]);
  if (changes) throw new Error(`실행 전 통합 worktree가 깨끗해야 합니다\n${changes}`);
}

function commonStateDirectory(root) {
  const commonDir = gitOutput(root, ["rev-parse", "--git-common-dir"]);
  const absoluteCommonDir = isAbsolute(commonDir) ? commonDir : resolve(root, commonDir);
  return join(absoluteCommonDir, "codex-harness");
}

export function runnerStatePath(root, taskId) {
  return join(commonStateDirectory(root), `${taskId}.json`);
}

export function readRunnerState(root, taskId) {
  const path = runnerStatePath(root, taskId);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

export function writeRunnerState(root, state) {
  const path = runnerStatePath(root, state.task_id);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
  return path;
}

export function updateTaskStatus(root, taskId, status) {
  const { path, entries } = loadIndex(root);
  const task = findTask(entries, taskId);
  task.status = status;
  task.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(path, `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  return task;
}

function taskWorktreePath(root, taskId, worktreeRoot) {
  const repositoryName = basename(realpathSync(root));
  return join(worktreeRoot, `${repositoryName}-${taskId.toLowerCase()}`);
}

function normalizeInterruptedAttempt(state) {
  const attempt = state.attempts.at(-1);
  if (attempt && !attempt.finished_at) {
    attempt.finished_at = new Date().toISOString();
    attempt.exit_code = null;
    attempt.outcome = "interrupted";
  }
}

export function prepareTaskWorktree(root, task, config, options = {}) {
  ensureCleanIntegration(root);
  const existing = readRunnerState(root, task.id);
  if (existing) {
    normalizeInterruptedAttempt(existing);
    if (existing.status !== "in_progress") throw new Error(`${task.id}: 실행기 상태는 ${existing.status}입니다`);
    if (!existsSync(existing.worktree_path)) throw new Error(`${task.id}: 기록된 worktree가 없습니다: ${existing.worktree_path}`);
    if (gitOutput(root, ["rev-parse", "HEAD"]) !== existing.base_sha) {
      throw new Error(`${task.id}: 작업 worktree 생성 후 통합 HEAD가 변경되었습니다`);
    }
    writeRunnerState(root, existing);
    return existing;
  }

  const worktreeRoot = options.worktreeRoot ?? config.worktree_root ?? tmpdir();
  mkdirSync(worktreeRoot, { recursive: true });
  const worktreePath = taskWorktreePath(root, task.id, worktreeRoot);
  if (existsSync(worktreePath)) throw new Error(`${task.id}: worktree 경로가 이미 있습니다: ${worktreePath}`);
  const branch = `codex/task-${task.id.toLowerCase()}`;
  const baseSha = gitOutput(root, ["rev-parse", "HEAD"]);
  const branchExists = git(root, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], { allowFailure: true }).status === 0;
  git(root, branchExists
    ? ["worktree", "add", worktreePath, branch]
    : ["worktree", "add", "-b", branch, worktreePath, baseSha]);
  updateTaskStatus(worktreePath, task.id, "in_progress");

  const state = {
    schema_version: 1,
    task_id: task.id,
    status: "in_progress",
    base_sha: baseSha,
    branch,
    worktree_path: realpathSync(worktreePath),
    max_attempts: config.max_attempts,
    attempts: [],
    created_at: new Date().toISOString()
  };
  writeRunnerState(root, state);
  return state;
}

export function beginAttempt(root, state) {
  normalizeInterruptedAttempt(state);
  if (state.attempts.length >= state.max_attempts) {
    throw new Error(`${state.task_id}: 최대 ${state.max_attempts}회 시도를 모두 사용했습니다`);
  }
  const attempt = {
    number: state.attempts.length + 1,
    started_at: new Date().toISOString(),
    finished_at: null,
    exit_code: null,
    outcome: "running"
  };
  state.attempts.push(attempt);
  writeRunnerState(root, state);
  return attempt;
}

export function finishAttempt(root, state, attempt, result) {
  attempt.finished_at = new Date().toISOString();
  attempt.exit_code = result.exitCode;
  attempt.outcome = result.outcome;
  if (result.error) attempt.error = result.error;
  writeRunnerState(root, state);
}

export function codexPrompt(task, attemptNumber, maxAttempts) {
  return [
    `Implement task ${task.id}: ${task.title}.`,
    `This is attempt ${attemptNumber} of ${maxAttempts} in the task-only worktree.`,
    "Read AGENTS.md, the phase document, and all spec_refs.",
    `Follow test_mode=${task.test_mode} and satisfy check_ids=${task.check_ids.join(",")}.`,
    "Register missing check commands in .agents/harness/checks.json before verification.",
    "Use the repository tdd-guard skill when applicable.",
    "Preserve failed-attempt work and continue from the current worktree state.",
    "On success, record verification evidence with every spec_ref, mark only this task done, and create exactly one commit whose subject contains the task ID.",
    "Do not push, deploy, use --no-verify, or change unrelated tasks."
  ].join(" ");
}

export function runCodexAttempt(root, task, state, attempt, options = {}) {
  const codexBin = options.codexBin ?? "codex";
  const result = spawnSync(codexBin, [
    "exec",
    "-C",
    state.worktree_path,
    "--sandbox",
    "workspace-write",
    "--ask-for-approval",
    "never",
    codexPrompt(task, attempt.number, state.max_attempts)
  ], {
    cwd: state.worktree_path,
    stdio: options.stdio ?? "inherit",
    env: {
      ...process.env,
      HARNESS_TASK_ID: task.id,
      HARNESS_ATTEMPT: String(attempt.number)
    }
  });
  return {
    exitCode: result.status ?? 1,
    error: result.error?.message
  };
}

export function validateSuccessfulTask(task, state) {
  const { entries } = loadIndex(state.worktree_path);
  const errors = validateIndex(entries);
  if (errors.length) throw new Error(errors.join("; "));
  const completed = findTask(entries, task.id);
  if (completed.status !== "done") throw new Error(`${task.id}: Codex가 성공 종료하려면 작업 상태가 done이어야 합니다`);

  const verificationPath = join(state.worktree_path, ".agents/runs", task.id, "verification.json");
  if (!existsSync(verificationPath)) throw new Error(`${task.id}: 검증 증거가 없습니다`);
  const verification = JSON.parse(readFileSync(verificationPath, "utf8"));
  if (verification.status !== "passed") throw new Error(`${task.id}: 검증 증거를 통과하지 못했습니다`);
  const missingSpecs = task.spec_refs.filter((spec) => !verification.spec_refs?.includes(spec));
  if (missingSpecs.length) throw new Error(`${task.id}: 검증에 spec_refs가 없습니다: ${missingSpecs.join(", ")}`);

  const changes = gitOutput(state.worktree_path, ["status", "--porcelain"]);
  if (changes) throw new Error(`${task.id}: 성공한 작업 worktree는 깨끗해야 합니다\n${changes}`);
  const commitCount = Number(gitOutput(state.worktree_path, ["rev-list", "--count", `${state.base_sha}..HEAD`]));
  if (commitCount !== 1) throw new Error(`${task.id}: 작업 커밋은 정확히 하나여야 합니다. 현재: ${commitCount}`);
  const commit = gitOutput(state.worktree_path, ["rev-parse", "HEAD"]);
  const subject = gitOutput(state.worktree_path, ["log", "-1", "--pretty=%s"]);
  if (!subject.includes(task.id)) throw new Error(`${task.id}: 커밋 제목에 작업 ID가 있어야 합니다`);
  return { commit, verification_path: verificationPath };
}

export function integrateSuccessfulTask(root, state, success) {
  ensureCleanIntegration(root);
  if (gitOutput(root, ["rev-parse", "HEAD"]) !== state.base_sha) {
    throw new Error(`${state.task_id}: cherry-pick 전에 통합 HEAD가 변경되었습니다`);
  }
  git(root, ["cherry-pick", success.commit]);
  state.status = "done";
  state.integrated_commit = gitOutput(root, ["rev-parse", "HEAD"]);
  state.integrated_at = new Date().toISOString();
  writeRunnerState(root, state);
  return state.integrated_commit;
}

function blockedRunDirectory(state) {
  return join(state.worktree_path, ".agents/runs", state.task_id);
}

export function integrateBlockedTask(root, task, state) {
  if (state.attempts.length !== state.max_attempts) {
    throw new Error(`${task.id}: blocked 통합에는 정확히 ${state.max_attempts}회 시도가 필요합니다`);
  }
  const runDir = blockedRunDirectory(state);
  mkdirSync(runDir, { recursive: true });
  updateTaskStatus(state.worktree_path, task.id, "blocked");
  const attemptsPath = join(runDir, "attempts.json");
  writeFileSync(attemptsPath, `${JSON.stringify({
    task_id: task.id,
    status: "blocked",
    spec_refs: task.spec_refs,
    max_attempts: state.max_attempts,
    attempts: state.attempts,
    worktree_path: state.worktree_path,
    recorded_at: new Date().toISOString()
  }, null, 2)}\n`);
  const summaryPath = join(runDir, "manual-summary.md");
  writeFileSync(summaryPath, [
    `# ${task.id} 수동 확인 요약`,
    "",
    `- 상태: blocked`,
    `- 실행 횟수: ${state.attempts.length} / ${state.max_attempts}`,
    `- 실패 변경 보존 위치: \`${state.worktree_path}\``,
    `- spec refs: ${task.spec_refs.join(", ")}`,
    "",
    "실패한 변경은 통합 worktree에 반영하지 않았다. 위 worktree에서 마지막 오류와 검증 로그를 확인한 뒤 task를 재개한다.",
    ""
  ].join("\n"));

  const relativeAttempts = `.agents/runs/${task.id}/attempts.json`;
  const relativeSummary = `.agents/runs/${task.id}/manual-summary.md`;
  git(state.worktree_path, ["restore", "--staged", "."]);
  git(state.worktree_path, ["add", "docs/phases/index.jsonl", relativeAttempts, relativeSummary]);
  git(state.worktree_path, ["commit", "-m", `chore(${task.id}): record blocked harness execution`], {
    env: { HARNESS_TASK_ID: task.id }
  });
  const blockedCommit = gitOutput(state.worktree_path, ["rev-parse", "HEAD"]);

  ensureCleanIntegration(root);
  if (gitOutput(root, ["rev-parse", "HEAD"]) !== state.base_sha) {
    throw new Error(`${task.id}: blocked 상태 cherry-pick 전에 통합 HEAD가 변경되었습니다`);
  }
  git(root, ["cherry-pick", blockedCommit]);
  state.status = "blocked";
  state.blocked_commit = gitOutput(root, ["rev-parse", "HEAD"]);
  state.blocked_at = new Date().toISOString();
  writeRunnerState(root, state);
  return state.blocked_commit;
}

export function createRunnerFixtureRoot(prefix = "la-bie-belle-runner-") {
  return mkdtempSync(join(tmpdir(), prefix));
}
