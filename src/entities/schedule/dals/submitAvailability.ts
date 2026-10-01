import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 그 달 근무 신청을 통째로 덮어쓴다(`docs/2-design/modules/schedule/design.md`의
 * 「근무 신청 내기」). 날짜마다 보내지 않고 고른 목록을 한 번에 보낸다 — 함수가 그 달 행을
 * 지우고 받은 것을 넣는 한 트랜잭션이라 중간 상태가 없다.
 *
 * `dates`가 비어도 그대로 보낸다. 이미 낸 신청을 전부 무르는 길이 그것뿐이다.
 *
 * 거절 다섯은 화면이 갈라 받는다 — 승인 전이면 `not_allowed`, 그 달 근무표가 없으면
 * `no_schedule`, 확정됐으면 `already_confirmed`, 마감 다음날부터 `window_closed`, 그 달 밖
 * 날짜가 섞이면 `bad_dates`다.
 */
export async function submitAvailability(
  client: DB,
  month: string,
  dates: string[],
): Promise<void> {
  const { error } = await client.rpc("submit_availability", {
    p_month: `${month}-01`,
    p_dates: dates,
  });

  if (error) {
    throw toApiError(error);
  }
}
