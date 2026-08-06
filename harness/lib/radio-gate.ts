import { loadIndexEntries } from "./current-task.ts";
import { isPlainObject } from "./json-value.ts";
import {
  hasCodePaths,
  parseAllowedPaths,
  parseRiskLensTable,
  RISK_LENS_COLUMNS,
  RISK_LENS_HEADING,
} from "./radio-doc.ts";
import { INDEX_PATH, RADIO_LENS_SNAPSHOT_PATH, readTextFile, sha256OfFile } from "./repo.ts";
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
const RISK_LENSES: readonly string[] = RISK_LENS_COLUMNS.slice(1);
const NOT_APPLICABLE_PATTERN = /^해당 없음[ \t]*—[ \t]*(.+)$/u;

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

function isRiskLensCellValid(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("테스트함")) {
    return true;
  }
  const match = NOT_APPLICABLE_PATTERN.exec(trimmed);
  return match !== null && (match[1] ?? "").trim().length > 0;
}

export function checkRiskLensMarkdown(id: string, radioRef: string, markdown: string): Violation[] {
  const table = parseRiskLensTable(markdown);
  if (table === null || table.rows.length === 0) {
    return [
      {
        gate: GATE,
        file: radioRef,
        message: `${id}: 위험 렌즈 표가 없습니다`,
        hint: `${RISK_LENS_HEADING} 절에 인수 조건마다 Happy Path·주요 실패·경계값·권한·중복 요청·동시성 칸을 채운 표를 추가하세요. 형식: docs/execution/radio/README.md`,
      },
    ];
  }

  const violations: Violation[] = [];
  for (const row of table.rows) {
    for (const lens of RISK_LENSES) {
      const value = row.cells.get(lens) ?? "";
      if (isRiskLensCellValid(value)) {
        continue;
      }
      violations.push({
        gate: GATE,
        file: radioRef,
        line: row.line,
        message: `${id}: ${row.criterion} 행의 ${lens} 칸이 비어 있거나 사유가 없습니다`,
        hint: "'테스트함' 또는 '해당 없음 — <사유>' 형식으로 채우세요.",
      });
    }
  }
  return violations;
}

export function checkRiskLensTables(
  entries: readonly IndexEntry[],
  readMarkdown: (relativePath: string) => string | null,
  exemptTasks: ReadonlySet<string>,
): Violation[] {
  const violations: Violation[] = [];

  for (const { record } of entries) {
    if (!isTask(record) || !EXECUTABLE_STATUSES.includes(recordStatus(record))) {
      continue;
    }
    const id = recordId(record);
    if (exemptTasks.has(id)) {
      continue;
    }
    const radioRef = readStringField(record, "radio_ref");
    if (radioRef === null) {
      continue;
    }
    const markdown = readMarkdown(radioRef);
    if (markdown === null) {
      continue;
    }
    if (!hasCodePaths(parseAllowedPaths(markdown))) {
      continue;
    }
    violations.push(...checkRiskLensMarkdown(id, radioRef, markdown));
  }

  return violations;
}

type ExemptTasksLoad =
  | { readonly ok: true; readonly exemptTasks: ReadonlySet<string> }
  | { readonly ok: false; readonly violation: Violation };

function loadExemptTasks(root: string): ExemptTasksLoad {
  const text = readTextFile(root, RADIO_LENS_SNAPSHOT_PATH);
  if (text === null) {
    return {
      ok: false,
      violation: {
        gate: GATE,
        file: RADIO_LENS_SNAPSHOT_PATH,
        message: "위험 렌즈 면제 스냅숏 파일을 읽을 수 없습니다.",
        hint: `${RADIO_LENS_SNAPSHOT_PATH} 파일이 있어야 합니다.`,
      },
    };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      violation: {
        gate: GATE,
        file: RADIO_LENS_SNAPSHOT_PATH,
        message: `위험 렌즈 면제 스냅숏이 유효한 JSON이 아닙니다: ${(error as Error).message}`,
        hint: `${RADIO_LENS_SNAPSHOT_PATH}의 JSON 문법을 고치세요.`,
      },
    };
  }

  const exemptTasks = isPlainObject(decoded) ? decoded["exemptTasks"] : undefined;
  if (!Array.isArray(exemptTasks) || !exemptTasks.every((item) => typeof item === "string")) {
    return {
      ok: false,
      violation: {
        gate: GATE,
        file: RADIO_LENS_SNAPSHOT_PATH,
        message: "위험 렌즈 면제 스냅숏 형식이 올바르지 않습니다.",
        hint: `{ "exemptTasks": string[] } 형식이어야 합니다.`,
      },
    };
  }

  return { ok: true, exemptTasks: new Set(exemptTasks) };
}

export function runRadioGate(root: string): Violation[] {
  const loaded = loadIndexEntries(root, GATE);
  if (!loaded.ok) {
    return [loaded.violation];
  }

  const bindingViolations = checkRadioBindings(loaded.entries, (relativePath) =>
    sha256OfFile(root, relativePath),
  );

  const exemptTasksLoad = loadExemptTasks(root);
  if (!exemptTasksLoad.ok) {
    return [...bindingViolations, exemptTasksLoad.violation];
  }

  const lensViolations = checkRiskLensTables(
    loaded.entries,
    (relativePath) => readTextFile(root, relativePath),
    exemptTasksLoad.exemptTasks,
  );

  return [...bindingViolations, ...lensViolations];
}
