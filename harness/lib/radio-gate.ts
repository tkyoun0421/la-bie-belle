import { loadIndexEntries } from "./current-task.ts";
import { INDEX_PATH, sha256OfFile } from "./repo.ts";
import type { IndexEntry } from "./task-index.ts";
import {
  EXECUTABLE_STATUSES,
  isTask,
  readObjectField,
  readStringField,
  recordId,
  recordStatus,
} from "./task-index.ts";
import type { Violation } from "./violation.ts";

const GATE = "gate:radio";

export function checkRadioBindings(
  entries: readonly IndexEntry[],
  hashOf: (relativePath: string) => string | null,
): Violation[] {
  const violations: Violation[] = [];

  for (const { record, line } of entries) {
    if (!isTask(record) || !EXECUTABLE_STATUSES.includes(recordStatus(record))) {
      continue;
    }
    const id = recordId(record);
    const radioRef = readStringField(record, "radio_ref");
    if (radioRef === null) {
      violations.push({
        gate: GATE,
        file: INDEX_PATH,
        line,
        message: `${id}: radio_ref가 없어 승인된 RADIO를 확인할 수 없습니다.`,
        hint: "docs/execution/radio/<task-id>-radio.md 경로를 radio_ref에 기록하세요.",
      });
      continue;
    }

    const approvedHash = readStringField(
      readObjectField(record, "development_approval") ?? {},
      "radio_sha256",
    );
    if (approvedHash === null) {
      violations.push({
        gate: GATE,
        file: INDEX_PATH,
        line,
        message: `${id}: development_approval.radio_sha256이 없습니다.`,
        hint: "설계 단계에서 승인된 RADIO의 전체 파일 SHA-256을 기록하세요.",
      });
      continue;
    }

    const actualHash = hashOf(radioRef);
    if (actualHash === null) {
      violations.push({
        gate: GATE,
        file: radioRef,
        message: `${id}: RADIO 문서를 읽을 수 없습니다.`,
        hint: `${radioRef} 파일을 복구하거나 radio_ref 경로를 고치세요.`,
      });
      continue;
    }

    if (actualHash !== approvedHash) {
      violations.push({
        gate: GATE,
        file: radioRef,
        message: `${id}: RADIO 해시가 승인 기록과 다릅니다. 승인 ${approvedHash}, 실제 ${actualHash}`,
        hint: "승인 SHA-256에 결속된 RADIO 본문은 수정할 수 없습니다. 되돌리거나 설계 단계에서 다시 승인받으세요.",
      });
    }
  }

  return violations;
}

export function runRadioGate(root: string): Violation[] {
  const loaded = loadIndexEntries(root, GATE);
  if (!loaded.ok) {
    return [loaded.violation];
  }
  return checkRadioBindings(loaded.entries, (relativePath) => sha256OfFile(root, relativePath));
}
