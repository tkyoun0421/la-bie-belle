import { loadIndexEntries } from "./current-task.ts";
import { isPlainObject } from "./json-value.ts";
import { readTextFile } from "./repo.ts";
import { isTask, recordId, recordStatus } from "./task-index.ts";
import type { Violation } from "./violation.ts";

const GATE = "gate:retro";

export const RETROSPECTIVE_CASES_PATH = "docs/execution/retrospective/cases.md";
export const RETROSPECTIVE_EXEMPT_PATH = "docs/execution/retrospective/exempt.json";

export type ExemptSnapshot =
  | { readonly ok: true; readonly taskIds: ReadonlySet<string> }
  | { readonly ok: false; readonly message: string };

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseExemptSnapshot(text: string | null): ExemptSnapshot {
  if (text === null) {
    return { ok: false, message: "면제 스냅숏 파일이 없습니다." };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch (error) {
    return { ok: false, message: `면제 스냅숏이 유효한 JSON이 아닙니다: ${(error as Error).message}` };
  }

  if (!isPlainObject(decoded)) {
    return { ok: false, message: "면제 스냅숏은 객체여야 합니다." };
  }

  const generatedAt = decoded["generated_at"];
  if (typeof generatedAt !== "string" || generatedAt.trim().length === 0) {
    return { ok: false, message: "면제 스냅숏의 generated_at이 비어 있습니다." };
  }

  const taskIds = decoded["task_ids"];
  if (!Array.isArray(taskIds) || taskIds.some((value) => typeof value !== "string")) {
    return { ok: false, message: "면제 스냅숏의 task_ids는 문자열 배열이어야 합니다." };
  }

  return { ok: true, taskIds: new Set(taskIds as string[]) };
}

export function hasCaseEntry(casesMarkdown: string, taskId: string): boolean {
  return new RegExp(`(?<![A-Za-z0-9-])${escapeForRegExp(taskId)}(?![A-Za-z0-9-])`, "u").test(
    casesMarkdown,
  );
}

export function checkRetrospectiveCoverage(
  doneTaskIds: readonly string[],
  exemptTaskIds: ReadonlySet<string>,
  casesMarkdown: string,
): string[] {
  return doneTaskIds
    .filter((taskId) => !exemptTaskIds.has(taskId))
    .filter((taskId) => !hasCaseEntry(casesMarkdown, taskId))
    .map((taskId) => `${taskId}: done task의 회고 항목이 cases.md에 없습니다.`);
}

export function runRetroGate(root: string): Violation[] {
  const loaded = loadIndexEntries(root, GATE);
  if (!loaded.ok) {
    return [loaded.violation];
  }

  const doneTaskIds = loaded.entries
    .filter((entry) => isTask(entry.record) && recordStatus(entry.record) === "done")
    .map((entry) => recordId(entry.record));

  const snapshot = parseExemptSnapshot(readTextFile(root, RETROSPECTIVE_EXEMPT_PATH));
  if (!snapshot.ok) {
    return [
      {
        gate: GATE,
        file: RETROSPECTIVE_EXEMPT_PATH,
        message: snapshot.message,
        hint: '형식: {"generated_at": ISO8601, "task_ids": ["P0-T01", ...]} — 시행 시점 done 전수 스냅숏입니다.',
      },
    ];
  }

  const casesMarkdown = readTextFile(root, RETROSPECTIVE_CASES_PATH) ?? "";

  return checkRetrospectiveCoverage(doneTaskIds, snapshot.taskIds, casesMarkdown).map(
    (message) => ({
      gate: GATE,
      file: RETROSPECTIVE_CASES_PATH,
      message,
      hint: "retrospector를 마무리 커밋 전에 디스패치해 `- <task-id> | 성공|실패 | 요약 | 근거 경로` 한 줄을 남기세요.",
    }),
  );
}
