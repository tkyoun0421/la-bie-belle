import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type UnscopedDelete = {
  file: string;
  line: number;
  table: string;
};

const UNSCOPED_DELETE =
  /delete\s+from\s+([\w."]+)\s*(?:\\n)?\s*(?:;|["'`](?!\s*\+\s*["'`]\s*(?:where|using|returning)\b))/gi;

const SCANNED_ROOTS = ["src", "tests"];
const SKIPPED_DIRS = new Set(["node_modules", "lint"]);

export function unscopedDeletes(
  file: string,
  source: string,
): UnscopedDelete[] {
  return [...source.matchAll(UNSCOPED_DELETE)].map((match) => ({
    file,
    line: source.slice(0, match.index).split("\n").length,
    table: match[1],
  }));
}

function sourceFiles(root: string, relative: string): string[] {
  return readdirSync(path.join(root, relative), {
    withFileTypes: true,
  }).flatMap((entry) => {
    const next = path.join(relative, entry.name);

    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name) ? [] : sourceFiles(root, next);
    }

    return /\.tsx?$/.test(entry.name) ? [next] : [];
  });
}

export function repositoryUnscopedDeletes(
  root: string = process.cwd(),
): UnscopedDelete[] {
  return SCANNED_ROOTS.flatMap((dir) => sourceFiles(root, dir)).flatMap(
    (file) =>
      unscopedDeletes(file, readFileSync(path.join(root, file), "utf8")),
  );
}
