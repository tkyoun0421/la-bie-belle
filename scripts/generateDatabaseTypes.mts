/**
 * 로컬 Supabase의 표 정의에서 TypeScript 타입을 뽑아 `src/shared/api/databaseTypes.ts`에 쓴다.
 *
 * 뽑은 뒤 prettier를 한 번 더 먹인다 — CLI는 세미콜론 없이 내놓고 저장소는 세미콜론을 쓴다.
 * 이 두 단계가 한 덩이여야 CI가 다시 뽑아 `git diff`를 볼 때 포맷 때문에 헛빨간불이 안 난다.
 *
 * `--schema`에 `internal`을 같이 적는다. 시각 경계가 든 함수는 알맹이가 `internal`에 있고
 * integration 테스트가 그것을 직접 부르는데, 기본값으로 뽑으면 그 스키마가 안 들어온다.
 *
 * 절차의 정본은 [`data-access.md` 「생성 타입」](../docs/2-design/system/data-access.md#생성-타입)이다.
 */

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

/**
 * 뽑기가 조용히 절반만 되는 일이 있다 — 스키마 하나를 못 읽어도 종료 코드는 0이다. 그래서
 * 써둔 것을 다시 읽어 마이그레이션이 만든 표·뷰·함수가 다 들었는지 대조한다.
 */
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
