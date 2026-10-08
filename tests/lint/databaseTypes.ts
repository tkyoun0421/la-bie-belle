import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const TYPES_FILE = "src/shared/api/databaseTypes.ts";

export const ALIAS_FILE = "src/shared/api/database.ts";

const MIGRATIONS_DIR = "supabase/migrations";

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

const SCHEMA_LINE = /^ {2}([a-z_][a-z0-9_]*): \{$/;
const SECTION_LINE = /^ {4}(Tables|Views|Functions): \{$/;
const MEMBER_LINE = /^ {6}([a-z_][a-z0-9_]*):/;

const SECTION_KINDS: Record<string, DatabaseObjectKind> = {
  Tables: "table",
  Views: "view",
  Functions: "function",
};

const RETURNS = /\breturns\s+([a-z_]+)/i;
const BODY_START = /\bas\s+\$\$/i;

function key({ schema, kind, name }: DatabaseObject): string {
  return `${schema}.${kind}.${name}`;
}

function returnsTrigger(lines: string[], head: number): boolean {
  for (let index = head; index < lines.length; index += 1) {
    const returns = RETURNS.exec(lines[index]);

    if (returns !== null) {
      return returns[1].toLowerCase() === "trigger";
    }

    if (index > head && BODY_START.test(lines[index])) {
      return false;
    }
  }

  return false;
}

export function migrationObjects(sql: string): DatabaseObject[] {
  const found: DatabaseObject[] = [];
  const seen = new Set<string>();
  const lines = sql.split("\n");

  for (const [index, line] of lines.entries()) {
    const match = DDL.exec(line.trim());

    if (match === null) {
      continue;
    }

    const kind = match[1].toLowerCase().endsWith("view")
      ? "view"
      : (match[1].toLowerCase() as DatabaseObjectKind);

    if (kind === "function" && returnsTrigger(lines, index)) {
      continue;
    }

    const object = { schema: match[2], kind, name: match[3] };

    if (!seen.has(key(object))) {
      seen.add(key(object));
      found.push(object);
    }
  }

  return found;
}

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

  return `${violation.file}이 \`SupabaseClient\`를 직접 가져온다. 스키마가 \`any\`라 표 이름이 검사를 안 받는다 — \`${ALIAS_FILE}\`의 \`DB\`를 써라.`;
}

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
