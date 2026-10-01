import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * `system/runtime.md#업무-상수`가 정한 대조 — SQL 함수와 TypeScript 양쪽에 같은 **값**으로
 * 사는 업무 상수만 본다. 표기를 지시하지 않는다 — `interval '1 hour'`든 `interval '60
 * minutes'`든 값이 같으면 통과한다. 한쪽에만 사는 상수(`checked_at` 기기 오차 10분은
 * SQL만, 지각 유예 10분은 TS만)는 이 목록 밖이라 대조 대상이 아니다.
 *
 * 상수마다 SQL에 나타나는 꼴이 다르다 — `duration`은 기간(`interval '...'`)이고
 * `time-of-day`는 하루 중 시각(`time '18:00'` 꼴)이다. 종류가 다르면 추출기도 다르다.
 */
export type SharedConstant =
  | {
      tsExportName: string;
      kind: "duration";
      /** export된 숫자의 단위 — SQL의 `interval` 값과 비교하려고 분으로 맞춘다 */
      tsUnit: "minutes" | "hours" | "days";
    }
  | {
      tsExportName: string;
      kind: "time-of-day";
      /** 지금은 시(0~23) 하나뿐이다 — 「그날 18시」처럼 정시 마감만 다룬다 */
      tsUnit: "hours";
    };

export const SHARED_CONSTANTS: SharedConstant[] = [
  {
    tsExportName: "CHECK_IN_WINDOW_LEAD_MINUTES",
    kind: "duration",
    tsUnit: "minutes",
  },
  {
    tsExportName: "CHECK_IN_WINDOW_CLOSE_HOUR_KST",
    kind: "time-of-day",
    tsUnit: "hours",
  },
  { tsExportName: "EXCUSE_DEADLINE_HOURS", kind: "duration", tsUnit: "hours" },
];

const MIGRATIONS_DIR = "supabase/migrations";
const CONSTANTS_FILE = "src/entities/attendance/model/constants.ts";

const DURATION_UNIT_TO_MINUTES: Record<string, number> = {
  minute: 1,
  minutes: 1,
  hour: 60,
  hours: 60,
  day: 1440,
  days: 1440,
};

/** `interval '<수> <단위>'` — 단위는 분·시·일 어느 표기든 받는다. 값의 정규화는 여기서 한다. */
const DURATION_LITERAL = /interval\s+'(\d+)\s*(minutes?|hours?|days?)'/gi;

/** 하루 중 시각 — `time '18:00'`·`'18:00'::time`·`'18:00:00'` 전부 같은 꼴로 읽는다. */
const TIME_OF_DAY_LITERAL = /'(\d{2}):(\d{2})(?::(\d{2}))?'/g;

function durationToMinutes(value: number, unit: string): number {
  return value * DURATION_UNIT_TO_MINUTES[unit.toLowerCase()];
}

/** SQL에서 `interval` 기간 리터럴을 전부 분으로 정규화해 뽑는다. */
export function migrationDurationMinutes(sql: string): number[] {
  return [...sql.matchAll(DURATION_LITERAL)].map((match) =>
    durationToMinutes(Number(match[1]), match[2]),
  );
}

/** SQL에서 하루 중 시각 리터럴을 전부 자정 기준 분으로 정규화해 뽑는다. */
export function migrationTimeOfDayMinutes(sql: string): number[] {
  return [...sql.matchAll(TIME_OF_DAY_LITERAL)].map(
    (match) => Number(match[1]) * 60 + Number(match[2]),
  );
}

/** `export const <이름> = <숫자>` 꼴에서 값을 뽑는다. 타입 주석이 있어도 받는다. */
export function constantValue(
  source: string,
  exportName: string,
): number | null {
  const pattern = new RegExp(
    `export const ${exportName}\\s*(?::[^=]+)?=\\s*(\\d+)`,
  );
  const match = source.match(pattern);

  return match ? Number(match[1]) : null;
}

export type SharedConstantViolation =
  | { tsExportName: string; kind: "missing-from-constants" }
  | {
      tsExportName: string;
      kind: "missing-from-migrations";
      expectedMinutes: number;
    };

/**
 * 목록에 있는 상수만 본다 — 양방향이되 대조 대상은 두 곳에 사는 것뿐이다.
 * `constantsSource`가 없으면(파일 자체가 없으면) 전부 `missing-from-constants`다.
 * 종류(`duration`/`time-of-day`)에 맞는 후보 집합에서만 값을 찾는다 — 기간 값이
 * 시각 후보에 우연히 섞이거나 그 반대가 되는 일이 없다.
 */
export function sharedConstantViolations(
  constantsSource: string | null,
  migrationsSql: string[],
): SharedConstantViolation[] {
  const durationCandidates = new Set(
    migrationsSql.flatMap((sql) => migrationDurationMinutes(sql)),
  );
  const timeOfDayCandidates = new Set(
    migrationsSql.flatMap((sql) => migrationTimeOfDayMinutes(sql)),
  );
  const violations: SharedConstantViolation[] = [];

  for (const entry of SHARED_CONSTANTS) {
    const tsValue =
      constantsSource === null
        ? null
        : constantValue(constantsSource, entry.tsExportName);

    if (tsValue === null) {
      violations.push({
        tsExportName: entry.tsExportName,
        kind: "missing-from-constants",
      });
      continue;
    }

    const expectedMinutes =
      entry.kind === "duration"
        ? durationToMinutes(tsValue, entry.tsUnit)
        : tsValue * 60;
    const candidates =
      entry.kind === "duration" ? durationCandidates : timeOfDayCandidates;

    if (!candidates.has(expectedMinutes)) {
      violations.push({
        tsExportName: entry.tsExportName,
        kind: "missing-from-migrations",
        expectedMinutes,
      });
    }
  }

  return violations;
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

export function repositorySharedConstantViolations(
  root: string = process.cwd(),
): SharedConstantViolation[] {
  let constantsSource: string | null;

  try {
    constantsSource = readFileSync(path.join(root, CONSTANTS_FILE), "utf8");
  } catch {
    constantsSource = null;
  }

  const migrationsSql = migrationFiles(root).map((file) =>
    readFileSync(file, "utf8"),
  );

  return sharedConstantViolations(constantsSource, migrationsSql);
}
