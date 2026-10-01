import type { DB } from "@/shared/api/database";
import {
  monthRange,
  REHEARSAL_COLUMNS,
  type Rehearsal,
} from "@/entities/rehearsal/dals/getMyRehearsals";

/**
 * 관리자가 보는 그 달 전원 리허설이다. **이름을 임베딩한다** — 날 시트가 줄마다 이름을
 * 앞에 붙이므로(`docs/2-design/modules/schedule/screens/rehearsal.md`의 「문안」) 줄마다
 * 프로필을 다시 읽지 않는다.
 *
 * **거르는 조건이 본인 것과 같다.** 관리자만 부르지만 관리자인지를 여기서 안 묻는다 — RLS가
 * 이미 「본인 행과 관리자 전원」으로 갈라(SCH-021) 근무자가 불러도 제 행만 온다.
 */

export type RehearsalWithName = Rehearsal & {
  profiles: { display_name: string | null } | null;
};

export async function getAllRehearsals(
  client: DB,
  month: string,
): Promise<RehearsalWithName[]> {
  const { from, to } = monthRange(month);
  const { data, error } = await client
    .from("rehearsals")
    .select(`${REHEARSAL_COLUMNS}, profiles(display_name)`)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date")
    .returns<RehearsalWithName[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
