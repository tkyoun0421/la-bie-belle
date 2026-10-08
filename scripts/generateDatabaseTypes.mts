import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  describeDatabaseTypesViolation,
  migrationsSql,
  missingObjects,
  TYPES_FILE,
} from "../tests/lint/databaseTypes.ts";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUTPUT = path.join(ROOT, TYPES_FILE);
const SCHEMAS = ["public", "internal"];

function fail(message: string): never {
  console.error(`생성 타입: ${message}`);
  process.exit(1);
}

let generated: string;

try {
  generated = execFileSync(
    "supabase",
    [
      "gen",
      "types",
      "typescript",
      "--local",
      ...SCHEMAS.flatMap((schema) => ["--schema", schema]),
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      shell: false,
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
} catch {
  fail(
    "`supabase gen types`가 실패했다 — 로컬 스택이 떠 있는지 `supabase status`로 봐라",
  );
}

if (!generated.includes("export type Database")) {
  fail("뽑은 것에 `export type Database`가 없다");
}

writeFileSync(OUTPUT, generated, "utf8");

execFileSync(
  path.join(ROOT, "node_modules/.bin/prettier"),
  ["--write", TYPES_FILE],
  { cwd: ROOT, stdio: "inherit", shell: false },
);

const missing = missingObjects(
  migrationsSql(ROOT),
  readFileSync(OUTPUT, "utf8"),
);

if (missing.length > 0) {
  fail(
    missing
      .map((object) =>
        describeDatabaseTypesViolation({ type: "missing-object", object }),
      )
      .join("\n"),
  );
}

console.log(`생성 타입: ${TYPES_FILE}가 섰다 — 스키마 ${SCHEMAS.join("·")}.`);
