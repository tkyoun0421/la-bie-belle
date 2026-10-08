import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type SharedConstant =
  | {
      tsExportName: string;
      kind: "duration";
      tsUnit: "minutes" | "hours" | "days";
    }
  | {
      tsExportName: string;
      kind: "time-of-day";
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
const CONSTANTS_FILE = "src/entities/attendance/consts/attendance.const.ts";

const DURATION_UNIT_TO_MINUTES: Record<string, number> = {
  minute: 1,
  minutes: 1,
  hour: 60,
  hours: 60,
  day: 1440,
  days: 1440,
};

const DURATION_LITERAL = /interval\s+'(\d+)\s*(minutes?|hours?|days?)'/gi;

const TIME_OF_DAY_LITERAL = /'(\d{2}):(\d{2})(?::(\d{2}))?'/g;

function durationToMinutes(value: number, unit: string): number {
  return value * DURATION_UNIT_TO_MINUTES[unit.toLowerCase()];
}

export function migrationDurationMinutes(sql: string): number[] {
  return [...sql.matchAll(DURATION_LITERAL)].map((match) =>
    durationToMinutes(Number(match[1]), match[2]),
  );
}

export function migrationTimeOfDayMinutes(sql: string): number[] {
  return [...sql.matchAll(TIME_OF_DAY_LITERAL)].map(
    (match) => Number(match[1]) * 60 + Number(match[2]),
  );
}

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
