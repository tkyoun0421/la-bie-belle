import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type TableRlsViolation = {
  table: string;
};

const MIGRATIONS_DIR = "supabase/migrations";

/** `data-access.md#읽기-rls-기본값`의 계약 — `public` 표는 전부 RLS를 켠다. */
const CREATE_TABLE =
  /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_][a-z0-9_]*)/gi;
const ENABLE_RLS =
  /alter\s+table\s+(?:if\s+exists\s+)?public\.([a-z_][a-z0-9_]*)\s+enable\s+row\s+level\s+security/gi;

const LINE_COMMENT = /--[^\n]*/g;

function withoutComments(sql: string): string {
  return sql.replace(LINE_COMMENT, "");
}

export function declaredTables(sql: string): string[] {
  return [...withoutComments(sql).matchAll(CREATE_TABLE)].map(
    (match) => match[1],
  );
}

export function rlsEnabledTables(sql: string): string[] {
  return [...withoutComments(sql).matchAll(ENABLE_RLS)].map(
    (match) => match[1],
  );
}

export function tableRlsViolations(sql: string): TableRlsViolation[] {
  const enabled = new Set(rlsEnabledTables(sql));

  return declaredTables(sql)
    .filter((table) => !enabled.has(table))
    .map((table) => ({ table }));
}

/** 파일 이름을 하드코딩하지 않는다 — 마이그레이션 셋이 계속 늘어난다. */
function migrationFiles(root: string): string[] {
  const dir = path.join(root, MIGRATIONS_DIR);
  let entries: string[];

  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.endsWith(".sql"))
    .sort()
    .map((entry) => path.join(dir, entry));
}

/** 표를 세운 파일과 RLS를 켠 파일이 달라도 되게 마이그레이션 전체를 한 덩어리로 본다. */
export function repositoryTableRlsViolations(
  root: string = process.cwd(),
): TableRlsViolation[] {
  const sql = migrationFiles(root)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  return tableRlsViolations(sql);
}
