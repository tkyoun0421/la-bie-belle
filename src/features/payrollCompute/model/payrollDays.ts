import {
  getAttendanceStatus,
  type AttendanceStatusInput,
  type CheckInRecord,
  type ExcuseDecision,
  type ExcuseStatusRecord,
} from "@/entities/attendance/model/attendanceStatus";
import {
  dayAmount,
  REGULAR_MINUTES,
  type DayAmount,
  type DayKind,
} from "@/entities/payroll/model/dayAmount";
import { wageAt, type WageRate } from "@/entities/payroll/model/wageAt";
import {
  rehearsalHours,
  type RehearsalRow,
} from "@/entities/rehearsal/model/rehearsalHours";
import type { ScheduleDay } from "@/entities/schedule/api/getMonthSchedule.api";
import { dayMinutes } from "@/features/payrollCompute/model/dayMinutes";

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
 * **시급이 없는 날도 목록에 든다.** 곱할 값이 없어 금액은 0원이지만 분은 그대로 채우고
 * `'wage-pending'`으로 낸다 — 기본 시급이 서기 전에 승인된 사람의 날이다(PAY-012). 버리면 그
 * 날의 시각과 분이 화면에 안 닿아 근무 회수·시간에서도 빠지고, 나온 날이 앱에서 사라진다
 * (`docs/2-design/modules/payroll/screens/payroll.md`의 「내역 목록」).
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

/**
 * `dayAmount`가 내는 셋에 `'wage-pending'`이 하나 더 붙는다. 그것은 금액 곡선의 결과가 아니라
 * 곱할 값이 아직 없다는 사실이라, 시급을 받아야만 도는 `dayAmount`가 낼 수 있는 값이 아니다.
 */
export type PayrollDayKind = DayKind | "wage-pending";

export type PayrollDay = Omit<DayAmount, "kind"> & {
  date: string;
  kind: PayrollDayKind;
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
): PayrollDay {
  const day = dayByDate.get(date) ?? null;
  const assignments =
    day === null
      ? []
      : input.assignments.filter((row) => row.day_id === day.id);

  if (day !== null && isAbsent(input, day, assignments)) {
    return { date, ...ABSENT };
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

  const wage = wageAt(input.rates, date);

  return wage === null
    ? { date, minutes, amount: 0, kind: "wage-pending" }
    : { date, ...dayAmount({ minutes, wage }) };
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

  return [...dates].sort().map((date) => payrollDate(input, dayByDate, date));
}

/**
 * 세 키가 낸 행을 이 모듈의 입력으로 접는 자리다 — 급여 재료(`['payroll']`)와 근무표
 * (`['schedule']`)와 리허설(`['rehearsal']`)이 따로 오는 것을 화면이 손으로 맞추지 않게
 * 한다(`docs/2-design/modules/payroll/design.md`의 「행위 밖의 실행 동작」).
 *
 * **남의 행을 여기서 거른다.** 관리자 세션에는 RLS가 전원 행을 내주고, 근무표의 배정과
 * 인증은 애초에 그 날 전원의 것이다 — 한 사람의 급여를 내는 이 자리가 `profileId` 하나로
 * 좁힌다.
 *
 * **금액 말고도 그날의 사실을 같이 낸다.** 포지션·근무 시각·교육 여부·연장 분·리허설 분과
 * 지각을 판정할 재료다. 화면이 그것들을 근무표 행에서 다시 캐면 「어느 배정이 내 것인가」와
 * 「연장이 몇 분인가」가 두 벌 서고, 급여 표의 값과 줄의 설명이 어긋날 수 있다.
 */
export type PayrollViewSource = {
  profileId: string;
  days: readonly ScheduleDay[];
  rates: readonly (WageRate & { profile_id: string })[];
  adjustments: readonly (PayrollAdjustment & { profile_id: string })[];
  excuses: readonly (PayrollExcuse & { profile_id: string })[];
  rehearsals: readonly PayrollRehearsal[];
  now: string;
};

export type PayrollViewDay = PayrollDay & {
  position: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isEducation: boolean;
  overtimeMinutes: number;
  rehearsalMinutes: number;
  attendance: AttendanceStatusInput | null;
};

/** 표가 드는 값이다 — `assignments.kind`의 check 제약이 `'regular'`과 `'training'` 둘뿐이다. */
const EDUCATION_KIND = "training";

/** DB는 초까지 싣고 화면은 안 싣는다 — `"10:00:00"`이 `"10:00"`이다. */
function clockLabel(clock: string): string {
  return clock.slice(0, 5);
}

function mine<Row extends { profile_id: string }>(
  rows: readonly Row[],
  profileId: string,
): Row[] {
  return rows.filter((row) => row.profile_id === profileId);
}

/** 취소되거나 교대로 넘어간 배정은 안 센다 — `ended_at`이 그 자국이다. */
function myAssignment(day: ScheduleDay, profileId: string) {
  return (
    day.assignments.find(
      (assignment) =>
        assignment.profile_id === profileId && assignment.ended_at === null,
    ) ?? null
  );
}

function myCheckIn(day: ScheduleDay, profileId: string): CheckInRecord | null {
  const row = day.check_ins.find((check) => check.profile_id === profileId);

  return row === undefined
    ? null
    : {
        checkedAt: row.checked_at,
        reportedAt: row.reported_at,
        receivedAt: row.received_at,
      };
}

export function payrollViewDays(source: PayrollViewSource): PayrollViewDay[] {
  const { profileId, now } = source;
  const myExcuses = mine(source.excuses, profileId);
  const dayByDate = new Map(source.days.map((day) => [day.work_date, day]));

  const computed = payrollDays({
    days: source.days.map((day) => ({
      id: day.id,
      work_date: day.work_date,
      starts_at: day.starts_at,
      ends_at: day.ends_at,
    })),
    assignments: source.days.flatMap((day) =>
      myAssignment(day, profileId) === null ? [] : [{ day_id: day.id }],
    ),
    adjustments: mine(source.adjustments, profileId),
    checkIns: source.days.flatMap((day) =>
      mine(day.check_ins, profileId).map((row) => ({
        day_id: day.id,
        checked_at: row.checked_at,
        reported_at: row.reported_at,
        received_at: row.received_at,
      })),
    ),
    excuses: myExcuses,
    rehearsals: source.rehearsals,
    rates: mine(source.rates, profileId),
    now,
  });

  return computed.map((day) => {
    const scheduled = dayByDate.get(day.date) ?? null;
    const assignment =
      scheduled === null ? null : myAssignment(scheduled, profileId);

    return {
      ...day,
      position: assignment === null ? null : assignment.position,
      startsAt:
        scheduled === null || assignment === null
          ? null
          : clockLabel(scheduled.starts_at),
      endsAt:
        scheduled === null || assignment === null
          ? null
          : clockLabel(scheduled.ends_at),
      isEducation: assignment !== null && assignment.kind === EDUCATION_KIND,
      overtimeMinutes: Math.max(0, day.minutes - REGULAR_MINUTES),
      rehearsalMinutes: source.rehearsals
        .filter((row) => row.work_date === day.date)
        .reduce((sum, row) => sum + rehearsalHours(row), 0),
      attendance:
        scheduled === null || assignment === null
          ? null
          : {
              workDate: scheduled.work_date,
              startsAt: scheduled.starts_at,
              endsAt: scheduled.ends_at,
              checkIn: myCheckIn(scheduled, profileId),
              excuses: myExcuses
                .filter((row) => row.day_id === scheduled.id)
                .map(excuseRecord),
              now,
            },
    };
  });
}
