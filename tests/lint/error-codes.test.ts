import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectListedCodes,
  collectRaiseCodes,
  findErrorCodeMismatch,
} from "@tests/lint/error-codes";

describe("collectRaiseCodes — SQL의 raise exception 메시지를 모은다", () => {
  it("여러 raise 문에서 코드를 모으고 중복을 없앤다", () => {
    const sql = `
      begin
        if not is_admin() then
          raise exception using message = 'not_allowed';
        end if;

        if exists (select 1 from x) then
          raise exception using message = 'already_submitted';
        end if;

        raise exception using message = 'not_allowed';
      end;
    `;

    expect(collectRaiseCodes(sql).sort()).toEqual(
      ["already_submitted", "not_allowed"].sort(),
    );
  });

  it("raise 문이 없으면 빈 배열이다", () => {
    expect(collectRaiseCodes("select 1;")).toEqual([]);
  });
});

describe("collectListedCodes — as const 배열 리터럴에서 코드를 모은다", () => {
  it("ERROR_CODES 배열의 문자열을 모은다", () => {
    const ts = `
      export const ERROR_CODES = [
        "not_allowed",
        "already_submitted",
        "already_approved",
      ] as const;

      export type ErrorCode = (typeof ERROR_CODES)[number];
    `;

    expect(collectListedCodes(ts).sort()).toEqual(
      ["already_approved", "already_submitted", "not_allowed"].sort(),
    );
  });
});

describe("findErrorCodeMismatch — 마이그레이션과 목록을 맞춘다", () => {
  it("일치하면 둘 다 빈 배열이다", () => {
    const migrations = ["raise exception using message = 'not_allowed';"];
    const list = `export const ERROR_CODES = ["not_allowed"] as const;`;

    expect(findErrorCodeMismatch({ migrations, list })).toEqual({
      onlyInMigrations: [],
      onlyInList: [],
    });
  });

  it("마이그레이션에만 있는 코드를 onlyInMigrations로 잡는다", () => {
    const migrations = [
      "raise exception using message = 'not_allowed';",
      "raise exception using message = 'invalid_phone';",
    ];
    const list = `export const ERROR_CODES = ["not_allowed"] as const;`;

    expect(findErrorCodeMismatch({ migrations, list })).toEqual({
      onlyInMigrations: ["invalid_phone"],
      onlyInList: [],
    });
  });

  it("목록에만 있는 코드를 onlyInList로 잡는다", () => {
    const migrations = ["raise exception using message = 'not_allowed';"];
    const list = `export const ERROR_CODES = ["not_allowed", "stale"] as const;`;

    expect(findErrorCodeMismatch({ migrations, list })).toEqual({
      onlyInMigrations: [],
      onlyInList: ["stale"],
    });
  });
});

describe("error-codes 대조 — 실제 저장소 회귀", () => {
  it("마이그레이션의 raise 코드와 error-codes.ts 목록이 어긋나지 않는다", () => {
    const migrationsDir = path.join(process.cwd(), "supabase/migrations");
    const migrations = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .map((file) => readFileSync(path.join(migrationsDir, file), "utf8"));
    const list = readFileSync(
      path.join(process.cwd(), "src/shared/api/error-codes.ts"),
      "utf8",
    );

    expect(findErrorCodeMismatch({ migrations, list })).toEqual({
      onlyInMigrations: [],
      onlyInList: [],
    });
  });
});
