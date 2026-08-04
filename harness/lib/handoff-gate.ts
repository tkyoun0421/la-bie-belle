import { loadCurrentTask } from "./current-task.ts";
import { readTextFile, runPath } from "./repo.ts";
import { recordId } from "./task-index.ts";
import type { Violation } from "./violation.ts";

const GATE = "gate:handoff";

export const REQUIRED_HANDOFF_LABELS: readonly string[] = ["작업 식별자", "현재 단계", "기준 시각"];
export const REQUIRED_HANDOFF_SECTIONS: readonly string[] = [
  "확정된 사실",
  "미결 사항",
  "다음 행동",
  "증거·산출물 경로",
];

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasFilledLabel(markdown: string, label: string): boolean {
  return new RegExp(`^[ \\t]*[-*][ \\t]*${escapeForRegExp(label)}[ \\t]*:[ \\t]*\\S`, "mu").test(
    markdown,
  );
}

function hasFilledSection(markdown: string, label: string): boolean {
  const lines = markdown.split("\n");
  const headingPattern = new RegExp(`^#{2,6}\\s*${escapeForRegExp(label)}\\s*$`, "u");
  for (let offset = 0; offset < lines.length; offset += 1) {
    if (!headingPattern.test(lines[offset] ?? "")) {
      continue;
    }
    for (let cursor = offset + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor] ?? "";
      if (/^#{1,6}\s/u.test(line)) {
        break;
      }
      if (line.trim().length > 0) {
        return true;
      }
    }
  }
  return false;
}

export function checkHandoffDocument(markdown: string): string[] {
  const missing: string[] = [];
  for (const label of REQUIRED_HANDOFF_LABELS) {
    if (!hasFilledLabel(markdown, label)) {
      missing.push(`필수 필드 "${label}"의 값이 없습니다.`);
    }
  }
  for (const label of REQUIRED_HANDOFF_SECTIONS) {
    if (!hasFilledSection(markdown, label)) {
      missing.push(`필수 절 "${label}"의 내용이 없습니다.`);
    }
  }
  return missing;
}

type TargetTask =
  | { readonly ok: true; readonly taskId: string | null }
  | { readonly ok: false; readonly violation: Violation };

function resolveTargetTask(root: string, taskId?: string): TargetTask {
  if (taskId !== undefined && taskId.length > 0) {
    return { ok: true, taskId };
  }
  const loaded = loadCurrentTask(root, GATE);
  if (!loaded.ok) {
    return loaded;
  }
  return { ok: true, taskId: loaded.task === null ? null : recordId(loaded.task.record) };
}

export function runHandoffGate(root: string, taskId?: string): Violation[] {
  const target = resolveTargetTask(root, taskId);
  if (!target.ok) {
    return [target.violation];
  }
  const targetTaskId = target.taskId;
  if (targetTaskId === null) {
    return [];
  }

  const handoffPath = runPath(targetTaskId, "handoff.md");
  const markdown = readTextFile(root, handoffPath);
  if (markdown === null) {
    return [
      {
        gate: GATE,
        file: handoffPath,
        message: `${targetTaskId}: handoff 파일이 없습니다.`,
        hint: "docs/workflow/HANDOFF.md 템플릿으로 단계 경계 기록을 남기세요.",
      },
    ];
  }

  return checkHandoffDocument(markdown).map((message) => ({
    gate: GATE,
    file: handoffPath,
    message: `${targetTaskId}: ${message}`,
    hint: "docs/workflow/HANDOFF.md의 최소 7개 필드를 모두 채우세요. 해당 없으면 '없음'이라고 쓰세요.",
  }));
}
