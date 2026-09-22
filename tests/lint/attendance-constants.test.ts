import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  constantValue,
  migrationDurationMinutes,
  migrationTimeOfDayMinutes,
  repositorySharedConstantViolations,
  sharedConstantViolations,
} from "@tests/lint/attendance-constants";

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), "attendance-constants-"));
}

function write(root: string, relative: string, body: string) {
  const absolute = join(root, relative);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body);
}

describe("마이그레이션의 기간(interval) 리터럴을 분 단위로 정규화해 읽는다", () => {
  it("interval '60 minutes'를 60분으로 읽는다", () => {
    expect(migrationDurationMinutes("interval '60 minutes'")).toEqual([60]);
  });

  it("interval '1 hour'도 같은 60분으로 읽는다 — 표기가 달라도 값이 같으면 같다", () => {
    expect(migrationDurationMinutes("interval '1 hour'")).toEqual([60]);
  });

  it("interval '2 days'를 2880분으로 읽는다", () => {
    expect(migrationDurationMinutes("interval '2 days'")).toEqual([2880]);
  });

  it("interval '48 hours'를 2880분으로 읽는다 — 이틀과 같은 값이다", () => {
    expect(migrationDurationMinutes("interval '48 hours'")).toEqual([2880]);
  });

  it("한 파일의 interval 여럿을 순서대로 다 뽑는다", () => {
    const sql = `
      interval '1 hour'
      interval '48 hours'
    `;

    expect(migrationDurationMinutes(sql)).toEqual([60, 2880]);
  });

  it("interval 리터럴이 없으면 빈 목록이다", () => {
    expect(migrationDurationMinutes("select 1;")).toEqual([]);
  });
});

describe("마이그레이션의 하루 중 시각 리터럴을 자정 기준 분으로 정규화해 읽는다", () => {
  it("time '18:00'을 1080분으로 읽는다", () => {
    expect(migrationTimeOfDayMinutes("time '18:00'")).toEqual([1080]);
  });

  it("'18:00'::time 캐스트도 같은 1080분으로 읽는다 — 앞뒤 구문은 안 본다", () => {
    expect(migrationTimeOfDayMinutes("'18:00'::time")).toEqual([1080]);
  });

  it("'18:00:00' 초 단위 표기도 같은 1080분으로 읽는다", () => {
    expect(migrationTimeOfDayMinutes("'18:00:00'")).toEqual([1080]);
  });

  it("자연스러운 SQL 문맥 안에서도 시각을 찾는다 — (work_date + time '18:00') at time zone 'Asia/Seoul'", () => {
    const sql = `(work_date + time '18:00') at time zone 'Asia/Seoul'`;

    expect(migrationTimeOfDayMinutes(sql)).toEqual([1080]);
  });

  it("시각 리터럴이 없으면 빈 목록이다", () => {
    expect(migrationTimeOfDayMinutes("select 1;")).toEqual([]);
  });
});

describe("constants.ts의 export된 숫자 값을 읽는다", () => {
  it("export const 이름 = 숫자 꼴에서 값을 뽑는다", () => {
    const source = "export const EXCUSE_DEADLINE_HOURS = 48;\n";

    expect(constantValue(source, "EXCUSE_DEADLINE_HOURS")).toBe(48);
  });

  it("타입 주석이 있어도 값을 뽑는다", () => {
    const source = "export const EXCUSE_DEADLINE_HOURS: number = 48;\n";

    expect(constantValue(source, "EXCUSE_DEADLINE_HOURS")).toBe(48);
  });

  it("이름이 없으면 null이다", () => {
    expect(
      constantValue(
        "export const SOMETHING_ELSE = 1;\n",
        "EXCUSE_DEADLINE_HOURS",
      ),
    ).toBeNull();
  });
});

describe("업무 상수 양방향 대조 — 두 곳에 사는 것만, 값으로만 본다", () => {
  it("constants.ts 자체가 없으면 셋 다 missing-from-constants다", () => {
    const violations = sharedConstantViolations(null, []);

    expect(violations).toEqual([
      {
        tsExportName: "CHECK_IN_WINDOW_LEAD_MINUTES",
        kind: "missing-from-constants",
      },
      {
        tsExportName: "CHECK_IN_WINDOW_CLOSE_HOUR_KST",
        kind: "missing-from-constants",
      },
      { tsExportName: "EXCUSE_DEADLINE_HOURS", kind: "missing-from-constants" },
    ]);
  });

  it("기간은 interval, 시각은 time 리터럴로 각각 맞으면 위반이 없다 — 자연스러운 SQL 표기다", () => {
    const source = `
      export const CHECK_IN_WINDOW_LEAD_MINUTES = 60;
      export const CHECK_IN_WINDOW_CLOSE_HOUR_KST = 18;
      export const EXCUSE_DEADLINE_HOURS = 48;
    `;
    const migrations = [
      "(v_starts_at - interval '1 hour')",
      "(work_date + time '18:00') at time zone 'Asia/Seoul'",
      "(work_date + ends_at) at time zone 'Asia/Seoul' + interval '48 hours'",
    ];

    expect(sharedConstantViolations(source, migrations)).toEqual([]);
  });

  it("시각 상수를 interval로 적으면 값이 같아도 종류가 달라 안 맞는다 — 기간과 시각은 추출 규칙이 다르다", () => {
    const source = "export const CHECK_IN_WINDOW_CLOSE_HOUR_KST = 18;\n";

    const violations = sharedConstantViolations(source, [
      "interval '18 hours'",
    ]);

    expect(
      violations.find(
        (v) => v.tsExportName === "CHECK_IN_WINDOW_CLOSE_HOUR_KST",
      ),
    ).toEqual({
      tsExportName: "CHECK_IN_WINDOW_CLOSE_HOUR_KST",
      kind: "missing-from-migrations",
      expectedMinutes: 1080,
    });
  });

  it("TS에는 있는데 마이그레이션에 같은 값의 interval이 없으면 missing-from-migrations다", () => {
    const source = "export const EXCUSE_DEADLINE_HOURS = 48;\n";

    const violations = sharedConstantViolations(source, ["select 1;"]);

    expect(
      violations.find((v) => v.tsExportName === "EXCUSE_DEADLINE_HOURS"),
    ).toEqual({
      tsExportName: "EXCUSE_DEADLINE_HOURS",
      kind: "missing-from-migrations",
      expectedMinutes: 2880,
    });
  });

  it("TS 값이 바뀌면 옛 SQL 값과 더는 안 맞아 missing-from-migrations로 잡는다", () => {
    const source = "export const EXCUSE_DEADLINE_HOURS = 72;\n";

    const violations = sharedConstantViolations(source, [
      "interval '48 hours'",
    ]);

    expect(
      violations.find((v) => v.tsExportName === "EXCUSE_DEADLINE_HOURS"),
    ).toEqual({
      tsExportName: "EXCUSE_DEADLINE_HOURS",
      kind: "missing-from-migrations",
      expectedMinutes: 4320,
    });
  });

  it("목록 밖의 상수(지각 유예·checked_at 한도)는 한쪽에만 있어도 위반이 아니다", () => {
    const source = `
      export const LATE_THRESHOLD_MINUTES = 10;
      export const CHECK_IN_WINDOW_LEAD_MINUTES = 60;
      export const CHECK_IN_WINDOW_CLOSE_HOUR_KST = 18;
      export const EXCUSE_DEADLINE_HOURS = 48;
    `;
    const migrations = [
      "interval '10 minutes'",
      "interval '1 hour'",
      "time '18:00:00'",
      "interval '48 hours'",
    ];

    expect(sharedConstantViolations(source, migrations)).toEqual([]);
  });
});

describe("저장소 전체 대조 — 임시 디렉터리", () => {
  it("constants.ts와 마이그레이션이 자연스러운 표기로 맞으면 위반이 없다", () => {
    const root = tempRoot();
    write(
      root,
      "src/entities/attendance/model/constants.ts",
      [
        "export const CHECK_IN_WINDOW_LEAD_MINUTES = 60;",
        "export const CHECK_IN_WINDOW_CLOSE_HOUR_KST = 18;",
        "export const EXCUSE_DEADLINE_HOURS = 48;",
      ].join("\n"),
    );
    write(
      root,
      "supabase/migrations/20260101000000_attendance.sql",
      [
        "v_starts_at - interval '1 hour'",
        "(work_date + time '18:00') at time zone 'Asia/Seoul'",
        "v_ends_at + interval '48 hours'",
      ].join("\n"),
    );

    expect(repositorySharedConstantViolations(root)).toEqual([]);
  });

  it("constants.ts가 없으면 셋 다 missing-from-constants다", () => {
    const root = tempRoot();
    write(
      root,
      "supabase/migrations/20260101000000_attendance.sql",
      "interval '1 hour' time '18:00' interval '48 hours'\n",
    );

    expect(repositorySharedConstantViolations(root)).toEqual([
      {
        tsExportName: "CHECK_IN_WINDOW_LEAD_MINUTES",
        kind: "missing-from-constants",
      },
      {
        tsExportName: "CHECK_IN_WINDOW_CLOSE_HOUR_KST",
        kind: "missing-from-constants",
      },
      { tsExportName: "EXCUSE_DEADLINE_HOURS", kind: "missing-from-constants" },
    ]);
  });

  it("마이그레이션 파일 이름과 상관없이 supabase/migrations/*.sql 전부를 읽는다", () => {
    const root = tempRoot();
    write(
      root,
      "src/entities/attendance/model/constants.ts",
      "export const EXCUSE_DEADLINE_HOURS = 48;",
    );
    write(root, "supabase/migrations/20260101000000_a.sql", "select 1;\n");
    write(
      root,
      "supabase/migrations/20260201000000_b.sql",
      "interval '48 hours'\n",
    );

    expect(
      repositorySharedConstantViolations(root).find(
        (v) => v.tsExportName === "EXCUSE_DEADLINE_HOURS",
      ),
    ).toBeUndefined();
  });
});

describe("업무 상수 대조 — 실제 저장소 회귀", () => {
  it("현재 저장소의 constants.ts와 마이그레이션이 서로 맞는다 (회귀)", () => {
    expect(repositorySharedConstantViolations(process.cwd())).toEqual([]);
  });
});
