import { CANCEL_REASON_MAX_LENGTH } from "@/screens/scheduleWorker/consts/scheduleWorker.const";

/**
 * 근무 취소 시트의 사유 판정과 「보낸 뒤」 배지다
 * (`docs/2-design/modules/schedule/screens/schedule-worker.md`의 「근무 취소 시트 짜임」과
 * 「보낸 뒤」).
 *
 * **상한이 `create_cancel_request`와 같은 100자다.** 화면이 먼저 막고 함수가 마지막 문이라
 * 두 수가 갈리면 눌리는 버튼이 서버에서 거절당한다 — 글자를 막는 `Input`과 이 판정이 같은
 * 수를 봐야 해서 수는 [`consts/`](../consts/scheduleWorker.const.ts)가 소유한다.
 *
 * 공백만 적은 것은 빈 것과 같다 — 사유가 근무자의 말로 관리자에게 그대로 가는 자리라
 * 빈 글이 판정의 근거가 되면 안 된다.
 */

export function isValidCancelReason(reason: string): boolean {
  const written = reason.trim();

  return written.length > 0 && written.length <= CANCEL_REASON_MAX_LENGTH;
}

/** 살아 있는 취소 요청이 있으면 내 줄과 날짜 줄에 서는 Badge neutral의 글자다. */
export function cancelRequestBadge(hasActiveRequest: boolean): string | null {
  return hasActiveRequest ? "취소 요청 중" : null;
}
