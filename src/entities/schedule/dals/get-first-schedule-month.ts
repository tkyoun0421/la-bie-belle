import type { Db } from "@/shared/api/database";

/**
 * 근무표가 처음 선 달이다. 관리자 통계의 달 줄이 뒤로 갈 수 있는 바닥이고
 * (`docs/3-build/plans/stats-admin.md`의 「착수 판정」) 키는 `['schedule', 'first-month']`다.
 *
 * **급여가 승인일로 대신한 것과 갈린다**(`docs/2-design/modules/payroll/screens/payroll.md`의
 * 「첫 달 앞」). 그 화면의 바닥은 사람마다 다른데 여기 바닥은 홀 하나라 한 줄만 읽으면 된다 —
 * 지난 달들을 거슬러 훑을 일이 없다.
 *
 * `schedules.month`가 그 달의 첫날이라 `"YYYY-MM-01"` 꼴로 온다. 근무표가 하나도 없으면
 * `null`이고, 그때 달 줄은 뒤로 못 간다.
 */

export const FIRST_MONTH_SCOPE = "first-month";

export function firstScheduleMonthKey(): string[] {
  return ["schedule", FIRST_MONTH_SCOPE];
}

export async function getFirstScheduleMonth(
  client: Db,
): Promise<string | null> {
  const { data, error } = await client
    .from("schedules")
    .select("month")
    .order("month")
    .limit(1)
    .maybeSingle<{ month: string }>();

  if (error) {
    throw error;
  }

  return data?.month ?? null;
}
