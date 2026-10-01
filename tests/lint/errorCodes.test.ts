import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  errorCodeViolations,
  listedErrorCodes,
  migrationErrorCodes,
  repositoryErrorCodeViolations,
} from "@tests/lint/error-codes";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "error-codes-"));
}

function write(root: string, relative: string, body: string) {
  const absolute = join(root, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body);
}

describe("마이그레이션의 raise 문자열을 읽는다", () => {
  it("raise exception using message = '<코드>' 꼴에서 코드를 뽑는다", () => {
    const sql = `
      begin
        raise exception using message = 'not_allowed';
      end;
    `;

    expect(migrationErrorCodes(sql)).toEqual(["not_allowed"]);
  });

  it("한 파일의 raise 여럿을 순서대로 다 뽑는다", () => {
    const sql = `
      raise exception using message = 'already_exists';
      raise exception using message = 'deadline_past';
    `;

    expect(migrationErrorCodes(sql)).toEqual([
      "already_exists",
      "deadline_past",
    ]);
  });

  it("using message = 절이 없는 raise는 코드로 안 본다", () => {
    const sql = `
      raise notice 'just a log line';
      raise exception 'no code here';
    `;

    expect(migrationErrorCodes(sql)).toEqual([]);
  });
});

describe("error-codes.ts의 ERROR_CODES 목록을 읽는다", () => {
  it("export const ERROR_CODES 배열 안의 문자열 리터럴을 뽑는다", () => {
    const source = `
      export const ERROR_CODES = [
        "already_exists",
        "deadline_past",
      ] as const;
    `;

    expect(listedErrorCodes(source)).toEqual([
      "already_exists",
      "deadline_past",
    ]);
  });

  it("ERROR_CODES 선언이 없으면 빈 목록이다", () => {
    expect(listedErrorCodes("export const SOMETHING_ELSE = [];\n")).toEqual([]);
  });

  it("ERROR_CODES 밖의 문자열은 목록에 안 든다", () => {
    const source = `
      import { something } from "somewhere";

      export const ERROR_CODES = ["not_allowed"] as const;
    `;

    expect(listedErrorCodes(source)).toEqual(["not_allowed"]);
  });
});

describe("코드 목록과 마이그레이션의 양방향 대조", () => {
  it("양쪽에 같은 코드만 있으면 위반이 없다", () => {
    expect(errorCodeViolations(["not_allowed"], ["not_allowed"])).toEqual([]);
  });

  it("마이그레이션에만 있고 목록에 없으면 missing-from-list다", () => {
    expect(errorCodeViolations(["not_allowed"], [])).toEqual([
      { code: "not_allowed", kind: "missing-from-list" },
    ]);
  });

  it("목록에만 있고 마이그레이션에 없으면 missing-from-migrations다", () => {
    expect(errorCodeViolations([], ["not_allowed"])).toEqual([
      { code: "not_allowed", kind: "missing-from-migrations" },
    ]);
  });

  it("같은 코드가 여러 번 나와도 한 번만 본다", () => {
    expect(
      errorCodeViolations(
        ["not_allowed", "not_allowed"],
        ["not_allowed", "not_allowed"],
      ),
    ).toEqual([]);
  });
});

describe("저장소 전체 대조 — 임시 디렉터리", () => {
  it("마이그레이션 파일 이름과 상관없이 supabase/migrations/*.sql 전부를 읽는다", () => {
    const root = tempRoot();
    write(
      root,
      "supabase/migrations/20260101000000_a.sql",
      "raise exception using message = 'already_exists';\n",
    );
    write(
      root,
      "supabase/migrations/20260201000000_b.sql",
      "raise exception using message = 'deadline_past';\n",
    );
    write(
      root,
      "src/shared/api/error-codes.ts",
      'export const ERROR_CODES = ["already_exists", "deadline_past"] as const;\n',
    );

    expect(repositoryErrorCodeViolations(root)).toEqual([]);
  });

  it("마이그레이션에만 있는 코드를 잡는다", () => {
    const root = tempRoot();
    write(
      root,
      "supabase/migrations/20260101000000_a.sql",
      "raise exception using message = 'month_over';\n",
    );
    write(
      root,
      "src/shared/api/error-codes.ts",
      "export const ERROR_CODES = [] as const;\n",
    );

    expect(repositoryErrorCodeViolations(root)).toEqual([
      { code: "month_over", kind: "missing-from-list" },
    ]);
  });

  it("목록에만 있는 코드를 잡는다", () => {
    const root = tempRoot();
    write(root, "supabase/migrations/20260101000000_a.sql", "select 1;\n");
    write(
      root,
      "src/shared/api/error-codes.ts",
      'export const ERROR_CODES = ["too_early"] as const;\n',
    );

    expect(repositoryErrorCodeViolations(root)).toEqual([
      { code: "too_early", kind: "missing-from-migrations" },
    ]);
  });
});

describe("코드 목록 대조 — 실제 저장소 회귀", () => {
  it("현재 저장소의 error-codes.ts와 마이그레이션이 서로 맞는다 (회귀)", () => {
    expect(repositoryErrorCodeViolations(process.cwd())).toEqual([]);
  });
});
