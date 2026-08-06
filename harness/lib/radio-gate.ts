import { createHash } from "node:crypto";
import { loadIndexEntries } from "./current-task.ts";
import { isPlainObject } from "./json-value.ts";
import {
  ALLOWED_PATHS_HEADING,
  hasCodePaths,
  parseAllowedPaths,
  parseRiskLensTable,
  RISK_LENS_COLUMNS,
  RISK_LENS_HEADING,
} from "./radio-doc.ts";
import { INDEX_PATH, RADIO_LENS_SNAPSHOT_PATH, readTextFile } from "./repo.ts";
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
const EXEMPT_TASK_ID_PATTERN = /^P[0-9]+-T[0-9]{2}$/u;

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
  const parsed = parseRiskLensTable(markdown);

  if (parsed.kind === "missing") {
    return [
      {
        gate: GATE,
        file: radioRef,
        message: `${id}: 위험 렌즈 표가 없습니다`,
        hint: `${RISK_LENS_HEADING} 절에 인수 조건마다 Happy Path·주요 실패·경계값·권한·중복 요청·동시성 칸을 채운 표를 추가하세요. 형식: docs/execution/radio/README.md`,
      },
    ];
  }

  if (parsed.kind === "header-mismatch") {
    return [
      {
        gate: GATE,
        file: radioRef,
        line: parsed.line,
        message: `${id}: 렌즈 표 헤더가 정본 형식과 다릅니다`,
        hint: `헤더는 | ${RISK_LENS_COLUMNS.join(" | ")} |여야 합니다. 형식: docs/execution/radio/README.md`,
      },
    ];
  }

  if (parsed.kind === "separator-mismatch") {
    return [
      {
        gate: GATE,
        file: radioRef,
        line: parsed.line,
        message: `${id}: 렌즈 표 구분자 행의 열 수가 헤더와 다릅니다`,
        hint: `구분자 행은 헤더와 같은 ${RISK_LENS_COLUMNS.length}열이어야 합니다.`,
      },
    ];
  }

  if (parsed.rows.length === 0) {
    return [
      {
        gate: GATE,
        file: radioRef,
        line: parsed.headerLine,
        message: `${id}: 렌즈 표에 인수 조건 행이 없습니다`,
        hint: `${RISK_LENS_HEADING} 표에 인수 조건마다 행을 하나 이상 추가하세요.`,
      },
    ];
  }

  const violations: Violation[] = [];
  for (const row of parsed.rows) {
    if (row.criterion.length === 0) {
      violations.push({
        gate: GATE,
        file: radioRef,
        line: row.line,
        message: `${id}: ${row.line}행의 인수 조건 칸이 비어 있습니다`,
        hint: "인수 조건 칸에 기술 인수 조건을 채우세요.",
      });
    }
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
    const allowedPaths = parseAllowedPaths(markdown);
    if (allowedPaths.length === 0) {
      violations.push({
        gate: GATE,
        file: radioRef,
        message: `${id}: 변경 허용 경로를 파싱할 수 없어 코드 task 여부를 판별할 수 없습니다`,
        hint: `${ALLOWED_PATHS_HEADING} 절과 코드펜스에 경로를 한 줄 이상 선언하세요.`,
      });
      continue;
    }
    if (!hasCodePaths(allowedPaths)) {
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

  const schemaError = describeExemptTasksSchemaError(exemptTasks);
  if (schemaError !== null) {
    return {
      ok: false,
      violation: {
        gate: GATE,
        file: RADIO_LENS_SNAPSHOT_PATH,
        message: `exemptTasks 스키마 위반: ${schemaError}`,
        hint: `${RADIO_LENS_SNAPSHOT_PATH}의 exemptTasks는 ${EXEMPT_TASK_ID_PATTERN.source} 형식·사전순 오름차순·중복 없음을 만족해야 합니다.`,
      },
    };
  }

  return { ok: true, exemptTasks: new Set(exemptTasks) };
}

function describeExemptTasksSchemaError(exemptTasks: readonly string[]): string | null {
  const invalidId = exemptTasks.find((id) => !EXEMPT_TASK_ID_PATTERN.test(id));
  if (invalidId !== undefined) {
    return `"${invalidId}"이(가) task ID 형식(${EXEMPT_TASK_ID_PATTERN.source})이 아닙니다.`;
  }

  const seen = new Set<string>();
  for (const id of exemptTasks) {
    if (seen.has(id)) {
      return `"${id}"이(가) 중복되었습니다.`;
    }
    seen.add(id);
  }

  const sorted = [...exemptTasks].sort();
  for (let index = 0; index < exemptTasks.length; index += 1) {
    if (exemptTasks[index] !== sorted[index]) {
      return "사전순 오름차순이 아닙니다.";
    }
  }

  return null;
}

type RadioContent = {
  readonly text: string;
  readonly sha256: string;
};

function readRadioContent(root: string, relativePath: string): RadioContent | null {
  const text = readTextFile(root, relativePath);
  if (text === null) {
    return null;
  }
  const sha256 = createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
  return { text, sha256 };
}

function createRadioContentReader(root: string): (relativePath: string) => RadioContent | null {
  const cache = new Map<string, RadioContent | null>();
  return (relativePath: string) => {
    if (!cache.has(relativePath)) {
      cache.set(relativePath, readRadioContent(root, relativePath));
    }
    return cache.get(relativePath) ?? null;
  };
}

export function runRadioGate(root: string): Violation[] {
  const loaded = loadIndexEntries(root, GATE);
  if (!loaded.ok) {
    return [loaded.violation];
  }

  const readRadio = createRadioContentReader(root);

  const bindingViolations = checkRadioBindings(
    loaded.entries,
    (relativePath) => readRadio(relativePath)?.sha256 ?? null,
  );

  const exemptTasksLoad = loadExemptTasks(root);
  if (!exemptTasksLoad.ok) {
    return [...bindingViolations, exemptTasksLoad.violation];
  }

  const lensViolations = checkRiskLensTables(
    loaded.entries,
    (relativePath) => readRadio(relativePath)?.text ?? null,
    exemptTasksLoad.exemptTasks,
  );

  return [...bindingViolations, ...lensViolations];
}
