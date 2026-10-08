import { readFileSync } from "node:fs";
import path from "node:path";
import { parseMarkdown } from "@tests/lint/markdown";

export type BacklogRow = {
  id: string;
  status: string;
  prerequisites: string[];
  documents: string[];
  line: number;
};

export type BacklogViolation = {
  id: string;
  detail: string;
  line: number;
  kind: "duplicate-id" | "unknown-status" | "missing-prerequisite";
};

const STATUSES = new Set(["candidate", "blocked", "ready", "active", "done"]);

const COLUMN_SECTION = "협업 기록";

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const SEPARATOR = /^\s*\|[\s:|-]*\|\s*$/;
const LINK = /!?\[[^\]]*\]\([^)]*\)/g;
const LIST_SEPARATOR = /[·,]/g;
const NONE = "—";

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function identifiers(cell: string): string[] {
  const spans = parseMarkdown(cell).codeSpans;

  if (spans.length > 0) {
    return spans.map((span) => span.text);
  }

  return cell
    .replace(LINK, " ")
    .replace(LIST_SEPARATOR, " ")
    .split(/\s+/)
    .filter((token) => token !== "" && token !== NONE);
}

function hrefs(cell: string): string[] {
  return parseMarkdown(cell).links.map((link) => link.href);
}

export function backlogColumns(readme: string): string[] {
  const lines = parseMarkdown(readme).section(COLUMN_SECTION);
  const header = lines.findIndex(
    (line, index) =>
      TABLE_ROW.test(line) && SEPARATOR.test(lines[index + 1] ?? ""),
  );

  return header === -1 ? [] : cells(lines[header]);
}

export function backlogRows(markdown: string, columns: string[]): BacklogRow[] {
  const lines = markdown.split("\n");
  const header = lines.findIndex(
    (line) =>
      TABLE_ROW.test(line) &&
      columns.every((column) => cells(line).includes(column)),
  );

  if (header === -1) {
    return [];
  }

  const at = (row: string[], column: string): string =>
    row[columns.indexOf(column)] ?? "";
  const rows: BacklogRow[] = [];

  for (let index = header + 2; index < lines.length; index += 1) {
    if (!TABLE_ROW.test(lines[index])) {
      break;
    }

    const row = cells(lines[index]);

    rows.push({
      id: identifiers(at(row, "작업 ID"))[0] ?? "",
      status: at(row, "상태"),
      prerequisites: identifiers(at(row, "선행 작업 ID")),
      documents: hrefs(at(row, "spec 또는 plan")),
      line: index + 1,
    });
  }

  return rows;
}

export function backlogViolations(
  markdown: string,
  columns: string[],
): BacklogViolation[] {
  const rows = backlogRows(markdown, columns);
  const known = new Set(rows.map((row) => row.id));
  const seen = new Set<string>();
  const violations: BacklogViolation[] = [];

  for (const row of rows) {
    if (seen.has(row.id)) {
      violations.push({
        id: row.id,
        detail: row.id,
        line: row.line,
        kind: "duplicate-id",
      });
    }
    seen.add(row.id);

    if (!STATUSES.has(row.status)) {
      violations.push({
        id: row.id,
        detail: row.status,
        line: row.line,
        kind: "unknown-status",
      });
    }

    for (const prerequisite of row.prerequisites) {
      if (!known.has(prerequisite)) {
        violations.push({
          id: row.id,
          detail: prerequisite,
          line: row.line,
          kind: "missing-prerequisite",
        });
      }
    }
  }

  return violations;
}

export function repositoryBacklog(root: string = process.cwd()): {
  markdown: string;
  columns: string[];
} {
  const read = (file: string): string =>
    readFileSync(path.join(root, "docs", file), "utf8");

  return {
    markdown: read("backlog.md"),
    columns: backlogColumns(read("README.md")),
  };
}
