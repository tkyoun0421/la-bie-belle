import { isPlainObject } from "./json-value.ts";

export type IndexRecord = Readonly<Record<string, unknown>>;

export type IndexEntry = {
  readonly line: number;
  readonly record: IndexRecord;
};

export type IndexParseError = {
  readonly line: number;
  readonly message: string;
};

export type ParsedIndex = {
  readonly entries: readonly IndexEntry[];
  readonly parseErrors: readonly IndexParseError[];
};

export const EXECUTABLE_STATUSES: readonly string[] = ["planned", "in_progress"];

export function parseIndexJsonl(text: string): ParsedIndex {
  const entries: IndexEntry[] = [];
  const parseErrors: IndexParseError[] = [];
  const lines = text.split("\n");

  for (let offset = 0; offset < lines.length; offset += 1) {
    const line = lines[offset] ?? "";
    const lineNumber = offset + 1;
    if (line.trim().length === 0) {
      continue;
    }
    let decoded: unknown;
    try {
      decoded = JSON.parse(line);
    } catch (error) {
      parseErrors.push({
        line: lineNumber,
        message: `JSON 파싱 실패: ${(error as Error).message}`,
      });
      continue;
    }
    if (!isPlainObject(decoded)) {
      parseErrors.push({ line: lineNumber, message: "한 줄에는 JSON 객체 하나만 둘 수 있습니다." });
      continue;
    }
    entries.push({ line: lineNumber, record: decoded });
  }

  return { entries, parseErrors };
}

export function isTask(record: IndexRecord): boolean {
  return record["kind"] === "task";
}

export function recordId(record: IndexRecord): string {
  const id = record["id"];
  return typeof id === "string" ? id : "(id 없음)";
}

export function recordStatus(record: IndexRecord): string {
  const status = record["status"];
  return typeof status === "string" ? status : "";
}

export function readStringField(record: IndexRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

export function readObjectField(record: IndexRecord, key: string): IndexRecord | null {
  const value = record[key];
  return isPlainObject(value) ? value : null;
}

export function findInProgressTasks(entries: readonly IndexEntry[]): IndexEntry[] {
  return entries.filter(
    (entry) => isTask(entry.record) && recordStatus(entry.record) === "in_progress",
  );
}
