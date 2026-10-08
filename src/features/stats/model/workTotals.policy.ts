import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";
import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";
import type {
  PersonTotal,
  PositionTotal,
  WorkAssignment,
  WorkDay,
  WorkInputs,
  WorkTotals,
} from "@/features/stats/model/stats.type";

const MINUTES_PER_HOUR = 60;

const KOREAN = "ko";

export function workInputsOf(days: readonly ScheduleDay[]): WorkInputs {
  return {
    assignments: days.flatMap((day) =>
      day.assignments.map((assignment) => ({
        id: assignment.id,
        dayId: day.id,
        profileId: assignment.profileId,
        displayName: assignment.name ?? "",
        position: assignment.position,
        kind: assignment.kind,
        endedAt: assignment.endedAt,
      })),
    ),
    days: days.map((day) => ({
      id: day.id,
      workDate: day.workDate,
      startsAt: day.startsAt,
      endsAt: day.endsAt,
    })),
  };
}

export function hoursLabel(minutes: number): string {
  const hours = minutes / MINUTES_PER_HOUR;

  return `${Number(hours.toFixed(1))}시간`;
}

export function isLiveAssignment(assignment: WorkAssignment): boolean {
  return assignment.endedAt === null;
}

export function shiftMinutes(day: WorkDay): number {
  return minutesOfTime(day.endsAt) - minutesOfTime(day.startsAt);
}

export function computeWorkTotals(
  assignments: readonly WorkAssignment[],
  days: readonly WorkDay[],
): WorkTotals {
  const minutesByDay = new Map(days.map((day) => [day.id, shiftMinutes(day)]));
  const people = new Map<string, PersonTotal>();
  const positions = new Map<string, PositionTotal>();

  for (const position of POSITION_ORDER) {
    positions.set(position, { position, minutes: 0, count: 0 });
  }

  let totalMinutes = 0;
  let totalCount = 0;

  for (const assignment of assignments.filter(isLiveAssignment)) {
    const minutes = minutesByDay.get(assignment.dayId);

    if (minutes === undefined) {
      continue;
    }

    totalMinutes += minutes;
    totalCount += 1;

    add(
      people,
      assignment.profileId,
      () => ({
        profileId: assignment.profileId,
        displayName: assignment.displayName,
        minutes: 0,
        count: 0,
      }),
      minutes,
    );

    add(
      positions,
      assignment.position,
      () => ({ position: assignment.position, minutes: 0, count: 0 }),
      minutes,
    );
  }

  return {
    totalMinutes,
    totalCount,
    byPerson: [...people.values()].sort(
      (left, right) =>
        right.minutes - left.minutes ||
        left.displayName.localeCompare(right.displayName, KOREAN),
    ),
    byPosition: [...positions.values()].sort(
      (left, right) =>
        right.minutes - left.minutes ||
        positionRank(left.position) - positionRank(right.position),
    ),
  };
}

type Tallied = { minutes: number; count: number };

function add<Row extends Tallied>(
  rows: Map<string, Row>,
  key: string,
  create: () => Row,
  minutes: number,
): void {
  const row = rows.get(key) ?? create();

  row.minutes += minutes;
  row.count += 1;
  rows.set(key, row);
}

function positionRank(position: string): number {
  const at = (POSITION_ORDER as readonly string[]).indexOf(position);

  return at === -1 ? POSITION_ORDER.length : at;
}

function minutesOfTime(time: string): number {
  const [hour, minute] = time.split(":").map(Number);

  return hour * MINUTES_PER_HOUR + minute;
}
