import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { relative, resolve } from "node:path";

export const EXECUTABLE_STATUSES = new Set(["planned", "in_progress"]);
export const EXECUTION_CONTRACT_STATUSES = new Set(["planned", "in_progress", "blocked", "verification_pending", "done"]);
export const TEST_MODES = new Set(["docs_only", "verification", "tdd"]);

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function issue(code, message) {
  return { code, message };
}

function validUserApproval(value) {
  return value?.by === "user" && typeof value.at === "string" && DATE.test(value.at);
}

export function executionContractIssues(task) {
  const issues = [];
  if (!TEST_MODES.has(task.test_mode)) issues.push(issue("EXECUTION_TEST_MODE", `${task.id}: 실행 계약에는 유효한 test_mode가 필요합니다`));
  if (!Array.isArray(task.check_ids) || task.check_ids.length === 0 || task.check_ids.some((id) => typeof id !== "string" || !id)) {
    issues.push(issue("EXECUTION_CHECK_IDS", `${task.id}: 실행 계약에는 비어 있지 않은 check_ids가 필요합니다`));
  }
  return issues;
}

export function taskContractIssues(task) {
  if (task.kind !== "task") return [];
  const issues = [];
  if (task.schema_version !== 3) issues.push(issue("SCHEMA_VERSION", `${task.id}: schema_version은 3이어야 합니다`));
  if (!new Set(["legacy-v2", "dual-approval-v3"]).has(task.approval_contract)) {
    issues.push(issue("APPROVAL_CONTRACT", `${task.id}: approval_contract가 유효하지 않습니다`));
    return issues;
  }
  if (task.approval_contract === "legacy-v2") {
    if (!new Set(["done", "skipped"]).has(task.status)) issues.push(issue("LEGACY_STATUS", `${task.id}: legacy-v2는 종료 이력에만 허용됩니다`));
    return issues;
  }
  if (task.status === "design_pending" && !validUserApproval(task.product_approval)) {
    issues.push(issue("PRODUCT_APPROVAL", `${task.id}: design_pending에는 product_approval이 필요합니다`));
  }
  if (task.status === "skipped") {
    if (!validUserApproval(task.skip_approval) || typeof task.skip_approval.reason !== "string" || !task.skip_approval.reason.trim()) {
      issues.push(issue("SKIP_APPROVAL", `${task.id}: skipped에는 사용자·날짜·이유가 있는 skip_approval이 필요합니다`));
    }
    return issues;
  }
  if (EXECUTION_CONTRACT_STATUSES.has(task.status)) {
    issues.push(...executionContractIssues(task));
    if (!validUserApproval(task.product_approval)) issues.push(issue("PRODUCT_APPROVAL", `${task.id}: 실행 계약에는 product_approval이 필요합니다`));
    const approval = task.development_approval;
    if (!validUserApproval(approval) || !Number.isInteger(approval?.radio_revision) || approval.radio_revision < 1 || !SHA256.test(approval?.radio_sha256 ?? "")) {
      issues.push(issue("DEVELOPMENT_APPROVAL", `${task.id}: 실행 계약에는 RADIO revision·SHA-256이 있는 development_approval이 필요합니다`));
    }
    if (typeof task.radio_ref !== "string") issues.push(issue("RADIO_REF", `${task.id}: 실행 계약에는 radio_ref가 필요합니다`));
  }
  return issues;
}

export function validateRadio(root, task) {
  if (!root || task.approval_contract !== "dual-approval-v3" || !EXECUTION_CONTRACT_STATUSES.has(task.status)) return [];
  const expected = `docs/development/${task.id}-radio.md`;
  if (task.radio_ref !== expected) return [issue("RADIO_PATH", `${task.id}: RADIO 경로는 ${expected}만 허용합니다`)];
  const radioRoot = resolve(root, "docs/development");
  const path = resolve(root, task.radio_ref);
  if (relative(radioRoot, path).startsWith("..")) return [issue("RADIO_PATH", `${task.id}: RADIO 경로가 허용된 문서 디렉터리를 벗어났습니다`)];
  if (!existsSync(path)) return [issue("RADIO_MISSING", `${task.id}: 승인된 RADIO 파일이 없습니다`)];
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) return [issue("RADIO_FILE", `${task.id}: RADIO는 심볼릭 링크가 아닌 일반 파일이어야 합니다`)];
  if (relative(radioRoot, realpathSync(path)).startsWith("..")) return [issue("RADIO_PATH", `${task.id}: RADIO 실제 경로가 허용된 문서 디렉터리를 벗어났습니다`)];
  const source = readFileSync(path);
  const revision = source.toString("utf8").match(/^\s*- revision:\s*(\d+)\s*$/m)?.[1];
  if (Number(revision) !== task.development_approval?.radio_revision) return [issue("RADIO_REVISION", `${task.id}: RADIO revision이 개발 승인 기록과 일치하지 않습니다`)];
  const hash = createHash("sha256").update(source).digest("hex");
  if (hash !== task.development_approval?.radio_sha256) return [issue("RADIO_SHA256", `${task.id}: RADIO SHA-256이 개발 승인 기록과 일치하지 않습니다`)];
  return [];
}

export function runnableIssues(entries, task, root) {
  const issues = taskContractIssues(task);
  if (!EXECUTABLE_STATUSES.has(task.status)) issues.push(issue("TASK_STATUS", `${task.id}: ${task.status} 작업은 실행할 수 없습니다. 개발 인터뷰 승인 후 planned 상태로 인계하세요`));
  issues.push(...validateRadio(root, task));
  const done = new Set(entries.filter((entry) => entry.status === "done").map((entry) => entry.id));
  const missing = (task.depends_on ?? []).filter((id) => !done.has(id));
  if (missing.length) issues.push(issue("DEPENDENCIES", `${task.id}: 완료되지 않은 의존 작업이 있습니다: ${missing.join(", ")}`));
  const otherActive = entries.filter((entry) => entry.kind === "task" && entry.status === "in_progress" && entry.id !== task.id);
  if (otherActive.length) issues.push(issue("MULTIPLE_IN_PROGRESS", `${task.id}: 다른 in_progress 작업이 있습니다: ${otherActive.map((entry) => entry.id).join(", ")}`));
  return issues;
}

export function formatIssues(issues) {
  return issues.map(({ code, message }) => `[${code}] ${message}`).join("\n");
}
