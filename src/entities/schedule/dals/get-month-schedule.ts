import type { Db } from "@/shared/api/database";

/**
 * 그 달 근무표를 읽는 두 손이다 — 연 날들과, 그 달 근무표 자체의 상태.
 *
 * **둘이 갈린 것은 날이 하나도 없는 달이 있기 때문이다.** 관리자가 근무표를 만들고 아직 날을
 * 안 열었으면 `days`가 비는데, 그 빈 배열은 「근무표를 아직 안 만든 달」과 구별되지 않는다.
 * 화면이 그 둘을 다르게 말해야 해서(`schedules/screens/schedule-worker.md`의 「마감 뒤 —
 * 확정 전」과 「근무표를 아직 안 만든 달」) 근무표 행을 따로 묻는다.
 *
 * **배정에 이름을 임베딩한다.** 근무자도 근무표 전체를 보고 명단에 남의 이름이 서므로
 * ([SCH-019](../../../../docs/2-design/modules/schedule/README.md#sch-019)) 날 시트를 열 때마다
 * 프로필을 다시 읽지 않는다. `profiles`의 RLS가 승인된 사람에게 이미 열려 있다.
 *
 * **출근도 같은 질의에 딸려 온다.** 「근무표 한 달은 `days`에서 `slots`·`assignments`·
 * `check_ins`를 임베딩한 한 질의」가 정본이라
 * ([design.md](../../../../docs/2-design/modules/schedule/design.md#행위-밖의-실행-동작))
 * 관리자 홈의 오늘 현황이 출근 수를 세러 표를 다시 읽지 않는다. `check_ins`의 RLS가
 * `is_approved()`라 근무자 세션에도 같이 온다.
 *
 * **그 달의 경계도 이 모듈이 소유한다.** `month`를 `"YYYY-MM"`으로 받든 그 달의 어느
 * 날짜로 받든 같은 달을 가리키게 `monthStart`가 맞춰준다 — 근무표를 만들고 여는 손들이
 * 달을 날짜로 들고 다닌다.
 */

export type ScheduleCheckIn = {
  id: string;
  profile_id: string;
  checked_at: string;
};

export type ScheduleAssignment = {
  id: string;
  position: string;
  kind: string;
  profile_id: string;
  ended_at: string | null;
  profiles: { display_name: string | null } | null;
};

export type ScheduleSlot = {
  id: string;
  positions: string[];
  ended_at: string | null;
};

export type ScheduleDay = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
  slots: ScheduleSlot[];
  assignments: ScheduleAssignment[];
  check_ins: ScheduleCheckIn[];
};

export type MonthWindow = {
  applicationDeadline: string | null;
  confirmedAt: string | null;
};

const DAY_COLUMNS = [
  "id",
  "work_date",
  "starts_at",
  "ends_at",
  "slots(id, positions, ended_at)",
  "assignments(id, position, kind, profile_id, ended_at, profiles!assignments_profile_id_fkey(display_name))",
  "check_ins(id, profile_id, checked_at)",
].join(", ");

export async function getMonthSchedule(
  client: Db,
  month: string,
): Promise<ScheduleDay[]> {
  const { data, error } = await client
    .from("days")
    .select(DAY_COLUMNS)
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month))
    .order("work_date")
    .returns<ScheduleDay[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

/** 그 달 근무표가 없으면 `null`이다 — 접수가 아직 안 열린 달이다. */
export async function getMonthWindow(
  client: Db,
  month: string,
): Promise<MonthWindow | null> {
  const { data, error } = await client
    .from("schedules")
    .select("application_deadline, confirmed_at")
    .eq("month", monthStart(month))
    .maybeSingle<{
      application_deadline: string | null;
      confirmed_at: string | null;
    }>();

  if (error) {
    throw error;
  }

  if (data === null) {
    return null;
  }

  return {
    applicationDeadline: data.application_deadline,
    confirmedAt: data.confirmed_at,
  };
}

/**
 * 그날 살아 있는 배정 수다. `ended_at`이 찬 배정은 취소되거나 교대로 넘어간 자국이라 사람
 * 수에 안 든다 — 그 판정을 부르는 쪽마다 다시 쓰면 한 곳에서만 고쳐진다.
 */
export function liveAssignmentCount(day: ScheduleDay): number {
  return day.assignments.filter((assignment) => assignment.ended_at === null)
    .length;
}

/** `"2026-12"`도 `"2026-12-25"`도 `"2026-12-01"`이다. */
export function monthStart(month: string): string {
  return `${month.slice(0, 7)}-01`;
}

/** `"2026-12"`의 다음은 `"2027-01-01"`이다. */
export function nextMonthStart(month: string): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const rolls = index === 12;

  return [
    String(rolls ? year + 1 : year).padStart(4, "0"),
    String(rolls ? 1 : index + 1).padStart(2, "0"),
    "01",
  ].join("-");
}
