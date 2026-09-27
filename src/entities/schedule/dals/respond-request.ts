import type { Db } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 받은 근무 요청에 답한다. 수락이면 새 배정 id를, 거절이면 `null`을 낸다 — 수락은 곧
 * 배정이라 돌려줄 것이 생긴다([design.md 「요청에 답하기」](../../../../docs/2-design/modules/schedule/design.md#요청에-답하기)).
 *
 * **수락은 배정까지 한 트랜잭션이다.** 둘이 같은 순간에 눌러도 하나만 들어가고 진 쪽이
 * `slot_full`을 받는다. 화면은 그 코드만 오류 블록 대신 토스트로 말한다.
 *
 * 나머지 거절은 `not_allowed`(그 요청의 대기 갈래가 아니다) · `wrong_kind`(답이 둘 중
 * 하나가 아니다) · `request_closed`(닫혔거나 만료됐다) · `not_qualified` ·
 * `already_assigned`다.
 */

export type RequestAnswer = "accept" | "decline";

export async function respondRequest(
  client: Db,
  requestId: string,
  answer: RequestAnswer,
): Promise<string | null> {
  const { data, error } = await client.rpc("respond_request", {
    p_request_id: requestId,
    p_answer: answer,
  });

  if (error) {
    throw toApiError(error);
  }

  return data;
}
