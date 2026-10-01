import type { DB } from "@/shared/api/database";
import { lastDateOfMonth, monthOf } from "@/shared/utils/kstDate";

/**
 * 그 달 본인 리허설이다. **조건이 날짜 범위뿐이다** — RLS가 이미 본인 행으로 좁혀
 * (`docs/2-design/modules/schedule/README.md`의 SCH-021) `profile_id`를 다시 안 건다.
 *
 * 달 경계는 `work_date`로 짓는다. 리허설은 `days`를 안 거쳐 근무표가 없는 달에도 행이 서고
 * (SCH-022) 기댈 다른 축이 없다.
 *
 * 갈래를 적는 열이 없어 행이 스스로 말한다 — `count`가 차 있으면 건수, 시각 둘이 차 있으면
 * 시각이다.
 */

export type Rehearsal = {
  id: string;
  profile_id: string;
  work_date: string;
  starts_at: string | null;
  ends_at: string | null;
  count: number | null;
};

export const REHEARSAL_COLUMNS =
  "id, profile_id, work_date, starts_at, ends_at, count";

/** `"2026-10"`도 `"2026-10-10"`도 같은 달의 첫날과 마지막 날로 읽는다. */
export function monthRange(month: string): { from: string; to: string } {
  return { from: `${monthOf(month)}-01`, to: lastDateOfMonth(month) };
}

export async function getMyRehearsals(
  client: DB,
  month: string,
): Promise<Rehearsal[]> {
  const { from, to } = monthRange(month);
  const { data, error } = await client
    .from("rehearsals")
    .select(REHEARSAL_COLUMNS)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date")
    .returns<Rehearsal[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
