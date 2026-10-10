import { MINUTES_PER_HOUR } from "@/shared/consts/time.const";
import { MINUTES_PER_COUNT } from "@/entities/rehearsal/consts/rehearsal.const";
import type {
  Rehearsal,
  RehearsalTotal,
} from "@/entities/rehearsal/model/rehearsal.type";

export type RehearsalClock = Pick<Rehearsal, "startsAt" | "endsAt" | "count">;

function minutesOfClock(clock: string): number {
  const [hour, minute] = clock.split(":").map(Number);

  return hour * MINUTES_PER_HOUR + minute;
}

export function rehearsalHours(row: RehearsalClock): number {
  if (row.count !== null) {
    return row.count * MINUTES_PER_COUNT;
  }

  if (row.startsAt === null || row.endsAt === null) {
    return 0;
  }

  return minutesOfClock(row.endsAt) - minutesOfClock(row.startsAt);
}

function total(rows: readonly RehearsalClock[]): RehearsalTotal {
  return rows.reduce<RehearsalTotal>(
    (sum, row) => ({
      count: sum.count + (row.count ?? 1),
      minutes: sum.minutes + rehearsalHours(row),
    }),
    { count: 0, minutes: 0 },
  );
}

export { total as dayTotal, total as monthTotal };
