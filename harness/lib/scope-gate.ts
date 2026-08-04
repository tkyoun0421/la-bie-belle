import { loadCurrentTask } from "./current-task.ts";
import { matchesAnyGlob } from "./glob.ts";
import { ALLOWED_PATHS_HEADING, parseAllowedPaths } from "./radio-doc.ts";
import { INDEX_PATH, listStagedFiles, readTextFile } from "./repo.ts";
import { readStringField, recordId } from "./task-index.ts";
import type { Violation } from "./violation.ts";

const GATE = "gate:scope";

export function checkStagedPaths(
  stagedPaths: readonly string[],
  allowedGlobs: readonly string[],
): string[] {
  return stagedPaths
    .filter((path) => !matchesAnyGlob(path, allowedGlobs))
    .map((path) => `${path}는 승인된 변경 허용 경로 밖입니다.`);
}

export function runScopeGate(root: string): Violation[] {
  const loaded = loadCurrentTask(root, GATE);
  if (!loaded.ok) {
    return [loaded.violation];
  }
  const current = loaded.task;
  if (current === null) {
    return [];
  }

  const taskId = recordId(current.record);
  const radioRef = readStringField(current.record, "radio_ref");
  if (radioRef === null) {
    return [
      {
        gate: GATE,
        file: INDEX_PATH,
        line: current.line,
        message: `${taskId}: radio_ref가 없어 변경 허용 경로를 확인할 수 없습니다.`,
        hint: "docs/execution/radio/<task-id>-radio.md 경로를 radio_ref에 기록하세요.",
      },
    ];
  }

  const markdown = readTextFile(root, radioRef);
  if (markdown === null) {
    return [
      {
        gate: GATE,
        file: radioRef,
        message: `${taskId}: RADIO 문서를 읽을 수 없습니다.`,
        hint: `${radioRef} 파일을 복구하거나 radio_ref 경로를 고치세요.`,
      },
    ];
  }

  const allowedGlobs = parseAllowedPaths(markdown);
  if (allowedGlobs.length === 0) {
    return [
      {
        gate: GATE,
        file: radioRef,
        message: `${taskId}: RADIO에 변경 허용 경로 선언이 없습니다.`,
        hint: `${ALLOWED_PATHS_HEADING} 절의 첫 코드블록에 한 줄당 glob 하나를 선언하세요.`,
      },
    ];
  }

  return checkStagedPaths(listStagedFiles(root), allowedGlobs).map((description) => ({
    gate: GATE,
    file: radioRef,
    message: `${taskId}: ${description}`,
    hint: `허용 경로: ${allowedGlobs.join(", ")}. 범위 밖 변경은 별도 task로 분리하세요.`,
  }));
}
