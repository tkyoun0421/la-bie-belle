import { MINUTES_PER_COUNT } from "@/entities/rehearsal/consts/rehearsal.const";
import type { RehearsalTotal } from "@/entities/rehearsal/model/rehearsal.type";

const MINUTES_PER_HOUR = 60;

export type RehearsalRow = {
  starts_at: string | null;
  ends_at: string | null;
  count: number | null;
};

function minutesOfClock(clock: string): number {
  const [hour, minute] = clock.split(":").map(Number);

  return hour * MINUTES_PER_HOUR + minute;
}

export function rehearsalHours(row: RehearsalRow): number {
  if (row.count !== null) {
    return row.count * MINUTES_PER_COUNT;
  }

  if (row.starts_at === null || row.ends_at === null) {
    return 0;
  }

  return minutesOfClock(row.ends_at) - minutesOfClock(row.starts_at);
}

function total(rows: readonly RehearsalRow[]): RehearsalTotal {
  return rows.reduce<RehearsalTotal>(
    (sum, row) => ({
      count: sum.count + (row.count ?? 1),
      minutes: sum.minutes + rehearsalHours(row),
    }),
    { count: 0, minutes: 0 },
  );
}

export { total as dayTotal, total as monthTotal };
