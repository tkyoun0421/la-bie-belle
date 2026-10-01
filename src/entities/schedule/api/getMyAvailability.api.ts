import type { DB } from "@/shared/api/database";
import { nextMonthStart } from "@/shared/utils/monthRange";

/**
 * 내가 그 달에 낸 근무 신청 날짜들이다. 신청은 날짜에 딸리고 `days`가 아니라서
 * (`docs/2-design/modules/schedule/design.md`의 「소유 데이터」) 아직 안 연 날짜에도 선다 —
 * 그래서 근무표를 타고 읽지 않고 달 범위로 직접 훑는다.
 *
 * **본인 행만 온다고 이 함수가 조건을 걸지 않는다.** `availabilities`의 RLS가 본인과 관리자만
 * 통과시키므로 근무자 세션에서는 이 질의가 이미 자기 행만 본다.
 */
export async function getMyAvailability(
  client: DB,
  month: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("availabilities")
    .select("work_date")
    .gte("work_date", `${month}-01`)
    .lt("work_date", nextMonthStart(month))
    .order("work_date")
    .returns<{ work_date: string }[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.work_date);
}
