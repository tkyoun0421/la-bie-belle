import {
  rehearsalHours,
  type RehearsalRow,
} from "@/entities/rehearsal/utils/rehearsalHours.utils";

/**
 * 그날 총 분이다 — **배정 시간 + 조정 분 + 리허설 시간**을 하나로 더한다
 * (`docs/2-design/modules/payroll/README.md`의 PAY-028). 셋을 따로 세면 배정 9시간과
 * 리허설 2건이 둘 다 9시간 미만이라 가산이 아예 안 난다.
 *
 * **배정 시간은 `starts_at`~`ends_at` 그대로다.** 휴게를 안 뺀다(PAY-004).
 *
 * **조정은 마지막 행 하나다.** 표에 unique가 없어 이력이 쌓이는데, 그중 `adjusted_at`이 가장
 * 늦은 행이 지금 유효한 값이다. 배열이 오는 순서를 안 믿는다.
 *
 * 결근을 음수 조정으로 지운 날은 합이 0으로 내려온다. 합이 음수로 내려가는 일도 막는다 —
 * 일한 시간이 음수인 날은 없다.
 */

export type WorkDayHours = {
  starts_at: string;
  ends_at: string;
};

export type AdjustmentRow = {
  minutes: number;
  adjusted_at: string;
};

/** 줄의 내용은 안 쓴다 — 그날 살아 있는 배정이 하나라도 있는지만 본다. */
export type LiveAssignments = readonly unknown[];

export type DayMinutesInput = {
  assignments: LiveAssignments;
  day: WorkDayHours | null;
  adjustments: readonly AdjustmentRow[];
  rehearsals: readonly RehearsalRow[];
};

const MINUTES_PER_HOUR = 60;

function minutesOfClock(clock: string): number {
  const [hour, minute] = clock.split(":").map(Number);

  return hour * MINUTES_PER_HOUR + minute;
}

function assignedMinutes(input: DayMinutesInput): number {
  if (input.assignments.length === 0 || input.day === null) {
    return 0;
  }

  return (
    minutesOfClock(input.day.ends_at) - minutesOfClock(input.day.starts_at)
  );
}

/** 지금 유효한 조정 분이다 — 행이 없으면 0이고, 여럿이면 `adjusted_at`이 가장 늦은 행이다. */
export function adjustedMinutes(rows: readonly AdjustmentRow[]): number {
  const latest = rows.reduce<AdjustmentRow | null>(
    (kept, row) =>
      kept === null || row.adjusted_at > kept.adjusted_at ? row : kept,
    null,
  );

  return latest?.minutes ?? 0;
}

function rehearsedMinutes(rows: readonly RehearsalRow[]): number {
  return rows.reduce((sum, row) => sum + rehearsalHours(row), 0);
}

export function dayMinutes(input: DayMinutesInput): number {
  const total =
    assignedMinutes(input) +
    adjustedMinutes(input.adjustments) +
    rehearsedMinutes(input.rehearsals);

  return Math.max(total, 0);
}
