import type { DB } from "@/shared/api/database";
import { toApiError } from "@/shared/api/errors";

/**
 * 근무 취소 요청 하나를 판정한다
 * ([design.md 「근무 취소 요청과 판정」](../../../../docs/2-design/modules/schedule/design.md#근무-취소-요청과-판정)).
 *
 * **갈래 이름이 표와 같다.** boolean 하나로 받으면 `cancel_requests.decision`의 값
 * (`approved`·`rejected`)과 화면의 말이 갈라져, 어느 쪽이 참인지를 부르는 자리마다 다시
 * 외워야 한다.
 *
 * 승인은 그 배정을 닫고 그 자리의 살아 있는 근무 요청도 같이 닫는다. 거절은 이유가
 * 필수고(`invalid_reason`) 그 글이 근무자에게 그대로 간다. 둘이 동시에 판정하면 늦은 쪽이
 * `already_decided`다.
 */

export type CancelDecision = "approved" | "rejected";

export async function decideCancelRequest(
  client: DB,
  cancelRequestId: string,
  decision: CancelDecision,
  reason?: string,
): Promise<void> {
  const { error } = await client.rpc("decide_cancel_request", {
    p_cancel_request_id: cancelRequestId,
    p_decision: decision,
    p_reason: reason,
  });

  if (error) {
    throw toApiError(error);
  }
}
