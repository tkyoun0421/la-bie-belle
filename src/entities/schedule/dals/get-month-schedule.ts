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
 */

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
].join(", ");

export async function getMonthSchedule(
  client: Db,
  month: string,
): Promise<ScheduleDay[]> {
  const { data, error } = await client
    .from("days")
    .select(DAY_COLUMNS)
    .gte("work_date", `${month}-01`)
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
    .eq("month", `${month}-01`)
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

/** `"2026-12"`의 다음은 `"2027-01-01"`이다. */
function nextMonthStart(month: string): string {
  const [year, index] = month.split("-").map(Number);
  const rolls = index === 12;

  return [
    String(rolls ? year + 1 : year).padStart(4, "0"),
    String(rolls ? 1 : index + 1).padStart(2, "0"),
    "01",
  ].join("-");
}
