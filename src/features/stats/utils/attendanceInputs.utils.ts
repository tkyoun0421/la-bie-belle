import type {
  AttendanceStatusInput,
  ExcuseDecision,
  ExcuseStatusRecord,
} from "@/entities/attendance/model/attendance.type";

/**
 * 근태 월 집계의 재료를 맞물린다. 그달 배정·날 시각과 인증·사유를 `(day_id, profile_id)`로
 * 짝지어 상태 함수가 그대로 먹을 입력을 낸다(plan stats-admin 「착수 판정」).
 *
 * **세는 것은 여기가 아니다.** 상태 여섯을 내는 것도 넷으로 세는 것도
 * `entities/attendance/model/attendanceSummary.ts`의 `tallyMonthlyAttendance`가 이미 하고,
 * 여기서 다시 짜면 명단·대시보드와 다른 숫자를 말하게 된다.
 *
 * **산 배정만 한 몫이다.** `ended_at`이 찬 배정은 그날 그 사람이 없던 것이라 인증 행이 남아
 * 있어도 몫이 안 생긴다 — 그 인증은 어느 입력에도 안 붙는다.
 *
 * **출근과 출근 인정을 안 합친다**(ATT-023). 가르는 것은 상태 함수고 이 파일은 사유 행을
 * 그대로 실어 보낼 뿐이다.
 */

export type AttendanceInputAssignment = {
  profile_id: string;
  ended_at: string | null;
};

export type AttendanceInputDay = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
  assignments: readonly AttendanceInputAssignment[];
};

export type AttendanceInputCheckIn = {
  day_id: string;
  profile_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
};

export type AttendanceInputExcuseStatus = {
  day_id: string;
  profile_id: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
};

const DECISIONS: readonly string[] = ["approved", "rejected"];

export function buildAttendanceInputs(
  days: readonly AttendanceInputDay[],
  checkIns: readonly AttendanceInputCheckIn[],
  excuseStatuses: readonly AttendanceInputExcuseStatus[],
  now: string,
): AttendanceStatusInput[] {
  const checkInAt = new Map(
    checkIns.map((checkIn) => [
      pairKey(checkIn.day_id, checkIn.profile_id),
      checkIn,
    ]),
  );
  const excusesAt = new Map<string, ExcuseStatusRecord[]>();

  for (const excuse of excuseStatuses) {
    const key = pairKey(excuse.day_id, excuse.profile_id);
    const here = excusesAt.get(key) ?? [];

    here.push({
      submittedAt: excuse.submitted_at,
      decidedAt: excuse.decided_at,
      decision: decisionOf(excuse.decision),
    });
    excusesAt.set(key, here);
  }

  return days.flatMap((day) =>
    day.assignments
      .filter((assignment) => assignment.ended_at === null)
      .map((assignment) => {
        const key = pairKey(day.id, assignment.profile_id);
        const checkIn = checkInAt.get(key);

        return {
          workDate: day.work_date,
          startsAt: day.starts_at,
          endsAt: day.ends_at,
          checkIn:
            checkIn === undefined
              ? null
              : {
                  checkedAt: checkIn.checked_at,
                  reportedAt: checkIn.reported_at,
                  receivedAt: checkIn.received_at,
                },
          excuses: excusesAt.get(key) ?? [],
          now,
        };
      }),
  );
}

/** 인증과 사유를 배정에 맞물리는 열쇠다. 만드는 자리가 하나라 양쪽이 어긋날 길이 없다. */
function pairKey(dayId: string, profileId: string): string {
  return `${dayId} ${profileId}`;
}

function decisionOf(decision: string | null): ExcuseDecision | null {
  return decision !== null && DECISIONS.includes(decision)
    ? (decision as ExcuseDecision)
    : null;
}
