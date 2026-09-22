/**
 * 마이그레이션이 만든 표·뷰·함수가 생성 타입에 다 들어 있는지, 그리고 생성 타입을 안 물린
 * 클라이언트가 남아 있는지 본다.
 *
 * 마이그레이션을 하나 더하고 `pnpm types`를 안 돌리면 그 표가 타입에 없다. 그래도 `tsc`는
 * 조용하다 — 아무도 그 표를 아직 안 쓰니까. 그 사이에 새 dal이 `from("새표")`를 적으면
 * 타입이 없어서 그때 처음 빨개지고, 원인은 마이그레이션 쪽에 있다. 그래서 DB 없이 무는
 * 검사를 여기 둔다.
 *
 * 로컬 DB에 붙어 다시 뽑은 것과 diff가 0인지 보는 것은 CI가 따로 한다. 여기는 이름만 맞춘다.
 *
 * 절차의 정본은 [`data-access.md` 「생성 타입」](../../docs/2-design/system/data-access.md#생성-타입)이다.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const TYPES_FILE = "src/shared/api/database-types.ts";

/** `Db` 별명을 내놓는 파일. 맨 `SupabaseClient`를 쓰는 예외는 여기 하나다. */
export const ALIAS_FILE = "src/shared/api/database.ts";

const MIGRATIONS_DIR = "supabase/migrations";

/** `tests/lint`은 안 본다 — 검사 픽스처가 잡히려고 그 코드를 글자로 들고 있다. */
const CLIENT_DIRS = ["src", "tests/integration"];

export type DatabaseObjectKind = "table" | "view" | "function";

export type DatabaseObject = {
  schema: string;
  kind: DatabaseObjectKind;
  name: string;
};

export type DatabaseTypesViolation =
  | { type: "missing-object"; object: DatabaseObject }
  | { type: "bare-client"; file: string };

const DDL =
  /^create\s+(?:or\s+replace\s+)?(table|view|materialized\s+view|function)\s+(?:if\s+not\s+exists\s+)?([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)/i;

/** 생성 타입은 스키마가 2칸, 갈래가 4칸, 이름이 6칸 들여쓰기로 선다. prettier가 그걸 고정한다. */
const SCHEMA_LINE = /^ {2}([a-z_][a-z0-9_]*): \{$/;
const SECTION_LINE = /^ {4}(Tables|Views|Functions): \{$/;
const MEMBER_LINE = /^ {6}([a-z_][a-z0-9_]*):/;

const SECTION_KINDS: Record<string, DatabaseObjectKind> = {
  Tables: "table",
  Views: "view",
  Functions: "function",
};

function key({ schema, kind, name }: DatabaseObject): string {
  return `${schema}.${kind}.${name}`;
}

/** 마이그레이션 SQL이 만드는 것들. 같은 함수를 두 번 적어도(`or replace`) 한 번만 센다. */
export function migrationObjects(sql: string): DatabaseObject[] {
  const found: DatabaseObject[] = [];
  const seen = new Set<string>();

  for (const line of sql.split("\n")) {
    const match = DDL.exec(line.trim());

    if (match === null) {
      continue;
    }

    const kind = match[1].toLowerCase().endsWith("view")
      ? "view"
      : (match[1].toLowerCase() as DatabaseObjectKind);
    const object = { schema: match[2], kind, name: match[3] };

    if (!seen.has(key(object))) {
      seen.add(key(object));
      found.push(object);
    }
  }

  return found;
}

/** 생성 타입 안에 선 것들. */
export function generatedObjects(types: string): DatabaseObject[] {
  const found: DatabaseObject[] = [];
  let schema: string | null = null;
  let kind: DatabaseObjectKind | null = null;

  for (const line of types.split("\n")) {
    const schemaMatch = SCHEMA_LINE.exec(line);

    if (schemaMatch !== null) {
      schema = schemaMatch[1];
      kind = null;
      continue;
    }

    const sectionMatch = SECTION_LINE.exec(line);

    if (sectionMatch !== null) {
      kind = SECTION_KINDS[sectionMatch[1]];
      continue;
    }

    const memberMatch = MEMBER_LINE.exec(line);

    if (memberMatch !== null && schema !== null && kind !== null) {
      found.push({ schema, kind, name: memberMatch[1] });
    }
  }

  return found;
}

export function missingObjects(sql: string, types: string): DatabaseObject[] {
  const present = new Set(generatedObjects(types).map(key));

  return migrationObjects(sql).filter((object) => !present.has(key(object)));
}

const BARE_CLIENT =
  /import\s+(?:type\s+)?\{[^}]*\bSupabaseClient\b[^}]*\}\s+from\s+["']@supabase\/supabase-js["']/;

export function bareClientFiles(
  files: { file: string; source: string }[],
): string[] {
  return files
    .filter(({ file }) => file !== ALIAS_FILE)
    .filter(({ source }) => BARE_CLIENT.test(source))
    .map(({ file }) => file);
}

export function describeDatabaseTypesViolation(
  violation: DatabaseTypesViolation,
): string {
  if (violation.type === "missing-object") {
    const { schema, kind, name } = violation.object;

    return `마이그레이션이 만든 ${kind} ${schema}.${name}이 ${TYPES_FILE}에 없다. \`pnpm types\`를 돌려라.`;
  }

  return `${violation.file}이 \`SupabaseClient\`를 직접 가져온다. 스키마가 \`any\`라 표 이름이 검사를 안 받는다 — \`${ALIAS_FILE}\`의 \`Db\`를 써라.`;
}

/** 마이그레이션 전부를 파일 이름 순으로 이어 붙인 SQL. */
export function migrationsSql(root: string = process.cwd()): string {
  const directory = path.join(root, MIGRATIONS_DIR);

  return readdirSync(directory)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(path.join(directory, file), "utf8"))
    .join("\n");
}

function sourceFiles(root: string): { file: string; source: string }[] {
  const found: { file: string; source: string }[] = [];

  function walk(relative: string) {
    for (const entry of readdirSync(path.join(root, relative), {
      withFileTypes: true,
    })) {
      const next = path.join(relative, entry.name);

      if (entry.isDirectory()) {
        walk(next);
      } else if (next.endsWith(".ts") || next.endsWith(".tsx")) {
        found.push({
          file: next,
          source: readFileSync(path.join(root, next), "utf8"),
        });
      }
    }
  }

  for (const directory of CLIENT_DIRS) {
    walk(directory);
  }

  return found;
}

export function repositoryDatabaseTypesViolations(
  root: string = process.cwd(),
): DatabaseTypesViolation[] {
  const types = readFileSync(path.join(root, TYPES_FILE), "utf8");

  return [
    ...missingObjects(migrationsSql(root), types).map(
      (object): DatabaseTypesViolation => ({ type: "missing-object", object }),
    ),
    ...bareClientFiles(sourceFiles(root)).map(
      (file): DatabaseTypesViolation => ({ type: "bare-client", file }),
    ),
  ];
}
