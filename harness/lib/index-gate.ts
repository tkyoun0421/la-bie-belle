import { validateAgainstSchema } from "./json-schema.ts";
import { INDEX_PATH, INDEX_SCHEMA_PATH, readTextFile } from "./repo.ts";
import type { IndexEntry } from "./task-index.ts";
import {
  EXECUTABLE_STATUSES,
  findInProgressTasks,
  isTask,
  parseIndexJsonl,
  readObjectField,
  readStringField,
  recordId,
  recordStatus,
} from "./task-index.ts";
import type { Violation } from "./violation.ts";

const GATE = "gate:index";

function violation(message: string, line: number | undefined, hint: string): Violation {
  return line === undefined
    ? { gate: GATE, file: INDEX_PATH, message, hint }
    : { gate: GATE, file: INDEX_PATH, line, message, hint };
}

export function checkIndexStateRules(entries: readonly IndexEntry[]): Violation[] {
  const violations: Violation[] = [];
  const knownIds = new Set(
    entries
      .map((entry) => readStringField(entry.record, "id"))
      .filter((id): id is string => id !== null),
  );

  const inProgress = findInProgressTasks(entries);
  if (inProgress.length > 1) {
    const ids = inProgress.map((entry) => recordId(entry.record)).join(", ");
    violations.push(
      violation(
        `in_progress task가 ${inProgress.length}개입니다: ${ids}`,
        inProgress[1]?.line,
        "동시에 진행할 수 있는 task는 하나입니다. 나머지를 planned 또는 blocked로 되돌리세요.",
      ),
    );
  }

  for (const entry of entries) {
    const { record, line } = entry;
    const id = recordId(record);
    const status = recordStatus(record);

    if (
      isTask(record) &&
      readStringField(record, "approval_contract") === "dual-approval-v3" &&
      EXECUTABLE_STATUSES.includes(status)
    ) {
      if (readObjectField(record, "product_approval") === null) {
        violations.push(
          violation(
            `${id}: status가 ${status}인데 product_approval이 없습니다.`,
            line,
            "기획 승인 없이 실행 대기 상태로 둘 수 없습니다. 기획 단계로 반환하세요.",
          ),
        );
      }
      if (readObjectField(record, "development_approval") === null) {
        violations.push(
          violation(
            `${id}: status가 ${status}인데 development_approval이 없습니다.`,
            line,
            "RADIO 승인 없이 실행 대기 상태로 둘 수 없습니다. 설계 단계로 반환하세요.",
          ),
        );
      }
      if (readStringField(record, "radio_ref") === null) {
        violations.push(
          violation(
            `${id}: status가 ${status}인데 radio_ref가 없습니다.`,
            line,
            "docs/execution/radio/<task-id>-radio.md 경로를 radio_ref에 기록하세요.",
          ),
        );
      }
    }

    const dependsOn = record["depends_on"];
    if (Array.isArray(dependsOn)) {
      for (const dependency of dependsOn) {
        if (typeof dependency === "string" && !knownIds.has(dependency)) {
          violations.push(
            violation(
              `${id}: depends_on의 ${dependency}가 index에 없습니다.`,
              line,
              "의존 대상 ID의 오타를 고치거나 해당 task를 index에 추가하세요.",
            ),
          );
        }
      }
    }

    const specRefs = record["spec_refs"];
    if (!Array.isArray(specRefs) || specRefs.length === 0) {
      violations.push(
        violation(
          `${id}: spec_refs가 최소 1개 필요합니다.`,
          line,
          "PRD·DOMAIN·ADR·DOCS 추적 링크를 최소 하나 기록하세요.",
        ),
      );
    }
  }

  return violations;
}

export function checkIndexSchema(entries: readonly IndexEntry[], schema: unknown): Violation[] {
  return entries.flatMap((entry) =>
    validateAgainstSchema(schema, entry.record).map((message) =>
      violation(
        `${recordId(entry.record)}: ${message}`,
        entry.line,
        `docs/execution/phases/index.schema.json 계약에 맞게 고치세요.`,
      ),
    ),
  );
}

export function runIndexGate(root: string): Violation[] {
  const indexText = readTextFile(root, INDEX_PATH);
  if (indexText === null) {
    return [
      violation(
        "task index 파일을 읽을 수 없습니다.",
        undefined,
        `${INDEX_PATH} 경로에 index 파일이 있어야 합니다.`,
      ),
    ];
  }

  const violations: Violation[] = [];
  const parsed = parseIndexJsonl(indexText);
  for (const parseError of parsed.parseErrors) {
    violations.push(
      violation(parseError.message, parseError.line, "한 줄에 유효한 JSON 객체 하나만 두세요."),
    );
  }

  const schemaText = readTextFile(root, INDEX_SCHEMA_PATH);
  if (schemaText === null) {
    violations.push({
      gate: GATE,
      file: INDEX_SCHEMA_PATH,
      message: "index 스키마 파일을 읽을 수 없습니다.",
      hint: `${INDEX_SCHEMA_PATH} 경로에 스키마 파일이 있어야 합니다.`,
    });
  } else {
    try {
      violations.push(...checkIndexSchema(parsed.entries, JSON.parse(schemaText)));
    } catch (error) {
      violations.push({
        gate: GATE,
        file: INDEX_SCHEMA_PATH,
        message: `index 스키마 파일이 유효한 JSON이 아닙니다: ${(error as Error).message}`,
        hint: "스키마 파일의 JSON 문법을 고치세요.",
      });
    }
  }

  violations.push(...checkIndexStateRules(parsed.entries));
  return violations;
}
