import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type ErrorCodeViolation = {
  code: string;
  kind: "missing-from-list" | "missing-from-migrations";
};

const MIGRATIONS_DIR = "supabase/migrations";
const CODE_LIST_FILE = "src/shared/consts/error.const.ts";

const RAISE_MESSAGE = /raise\s+exception\s+using\s+message\s*=\s*'([^']+)'/gi;

const ERROR_CODES_DECLARATION = /export const ERROR_CODES\s*=\s*\[([\s\S]*?)\]/;
const CODE_LITERAL = /['"]([a-z][a-z0-9_]*)['"]/g;

export function migrationErrorCodes(sql: string): string[] {
  return [...sql.matchAll(RAISE_MESSAGE)].map((match) => match[1]);
}

export function listedErrorCodes(source: string): string[] {
  const declaration = source.match(ERROR_CODES_DECLARATION);

  if (declaration === null) {
    return [];
  }

  return [...declaration[1].matchAll(CODE_LITERAL)].map((match) => match[1]);
}

export function errorCodeViolations(
  migrationCodes: string[],
  listedCodes: string[],
): ErrorCodeViolation[] {
  const migrationSet = new Set(migrationCodes);
  const listedSet = new Set(listedCodes);
  const violations: ErrorCodeViolation[] = [];

  for (const code of migrationSet) {
    if (!listedSet.has(code)) {
      violations.push({ code, kind: "missing-from-list" });
    }
  }

  for (const code of listedSet) {
    if (!migrationSet.has(code)) {
      violations.push({ code, kind: "missing-from-migrations" });
    }
  }

  return violations;
}

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

export function repositoryErrorCodeViolations(
  root: string = process.cwd(),
): ErrorCodeViolation[] {
  const migrationCodes = migrationFiles(root).flatMap((file) =>
    migrationErrorCodes(readFileSync(file, "utf8")),
  );
  const listedSource = readFileSync(path.join(root, CODE_LIST_FILE), "utf8");

  return errorCodeViolations(migrationCodes, listedErrorCodes(listedSource));
}
