import {
  getAttendanceStatus,
  type ExcuseDecision,
  type ExcuseStatusRecord,
} from "@/entities/attendance/model/attendance-status";
import type { RehearsalRow } from "@/entities/rehearsal/model/rehearsal-hours";
import { dayAmount, type DayAmount } from "@/features/payroll/model/day-amount";
import { dayMinutes } from "@/features/payroll/model/day-minutes";
import { wageAt, type WageRate } from "@/features/payroll/model/wage-at";

/**
 * 한 사람의 그 기간 급여를 날짜마다 낸다. 이 모듈이 급여 계산의 유일한 입구고, 아래 넷은
 * 여기서만 조립된다 — 화면은 날짜 목록만 받는다.
 *
 * **날짜를 합집합에서 모은다.** 배정·조정·리허설 셋 중 하나라도 있으면 그 날짜가 선다
 * (`docs/2-design/modules/payroll/design.md`의 「행위 밖의 실행 동작」). 배정만 훑으면 배정
 * 없이 리허설만 있는 날이 빠진다.
 *
 * **결근 판정을 다시 짜지 않는다.** `entities/attendance`의 함수를 그대로 부른다 — 두 벌이
 * 서면 어긋날 때 어느 쪽이 정본인지가 사라진다. 배정이 없는 날은 판정 자체를 안 건다.
 * 배정 없이는 결근일 수 없다.
 *
 * **결근인 날은 조정과 무관하게 0원이다.** 관리자가 음수 조정을 넣어 총 분이 0이 된 날과,
 * 아직 안 누른 날이 둘 다 있다(plan AC-06). 경로가 달라 어긋나기 쉬운 자리라 결근이면 분도
 * 금액도 0으로 못박는다.
 *
 * **시급이 없는 날은 목록에서 뺀다.** 첫 시급 행보다 이른 날은 승인 전 날짜다.
 *
 * 지각도 출근 인정도 교육 배정도 배정 시간 그대로 센다(PAY-003·PAY-007) — 급여에서 갈리는
 * 상태는 결근 하나뿐이라 나머지는 따로 묻지 않는다.
 */

export type PayrollWorkDay = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
};

export type PayrollAssignment = {
  day_id: string;
};

export type PayrollAdjustment = {
  day_id: string;
  minutes: number;
  adjusted_at: string;
};

export type PayrollCheckIn = {
  day_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
};

export type PayrollExcuse = {
  day_id: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
};

export type PayrollRehearsal = RehearsalRow & {
  work_date: string;
};

export type PayrollDaysInput = {
  days: readonly PayrollWorkDay[];
  assignments: readonly PayrollAssignment[];
  adjustments: readonly PayrollAdjustment[];
  checkIns: readonly PayrollCheckIn[];
  excuses: readonly PayrollExcuse[];
  rehearsals: readonly PayrollRehearsal[];
  rates: readonly WageRate[];
  now: string;
};

export type PayrollDay = DayAmount & {
  date: string;
};

const ABSENT: DayAmount = { minutes: 0, amount: 0, kind: "absent" };

function decisionOf(decision: string | null): ExcuseDecision | null {
  return decision === "approved" || decision === "rejected" ? decision : null;
}

function excuseRecord(excuse: PayrollExcuse): ExcuseStatusRecord {
  return {
    submittedAt: excuse.submitted_at,
    decidedAt: excuse.decided_at,
    decision: decisionOf(excuse.decision),
  };
}

function isAbsent(
  input: PayrollDaysInput,
  day: PayrollWorkDay,
  assignments: readonly PayrollAssignment[],
): boolean {
  if (assignments.length === 0) {
    return false;
  }

  const checkIn = input.checkIns.find((row) => row.day_id === day.id) ?? null;

  return (
    getAttendanceStatus({
      workDate: day.work_date,
      startsAt: day.starts_at,
      endsAt: day.ends_at,
      checkIn:
        checkIn === null
          ? null
          : {
              checkedAt: checkIn.checked_at,
              reportedAt: checkIn.reported_at,
              receivedAt: checkIn.received_at,
            },
      excuses: input.excuses
        .filter((row) => row.day_id === day.id)
        .map(excuseRecord),
      now: input.now,
    }) === "absent"
  );
}

function payrollDate(
  input: PayrollDaysInput,
  dayByDate: ReadonlyMap<string, PayrollWorkDay>,
  date: string,
): PayrollDay[] {
  const wage = wageAt(input.rates, date);

  if (wage === null) {
    return [];
  }

  const day = dayByDate.get(date) ?? null;
  const assignments =
    day === null
      ? []
      : input.assignments.filter((row) => row.day_id === day.id);

  if (day !== null && isAbsent(input, day, assignments)) {
    return [{ date, ...ABSENT }];
  }

  const minutes = dayMinutes({
    assignments,
    day,
    adjustments:
      day === null
        ? []
        : input.adjustments.filter((row) => row.day_id === day.id),
    rehearsals: input.rehearsals.filter((row) => row.work_date === date),
  });

  return [{ date, ...dayAmount({ minutes, wage }) }];
}

export function payrollDays(input: PayrollDaysInput): PayrollDay[] {
  const dayById = new Map(input.days.map((day) => [day.id, day]));
  const dayByDate = new Map(input.days.map((day) => [day.work_date, day]));
  const dates = new Set<string>();

  for (const row of [...input.assignments, ...input.adjustments]) {
    const day = dayById.get(row.day_id);

    if (day !== undefined) {
      dates.add(day.work_date);
    }
  }

  for (const rehearsal of input.rehearsals) {
    dates.add(rehearsal.work_date);
  }

  return [...dates]
    .sort()
    .flatMap((date) => payrollDate(input, dayByDate, date));
}
