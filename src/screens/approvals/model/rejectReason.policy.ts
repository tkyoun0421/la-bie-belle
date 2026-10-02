import {
  CANCEL_REJECT_REASONS,
  CUSTOM_REJECT_MAX_LENGTH,
  CUSTOM_REJECT_REASON,
} from "@/screens/approvals/consts/approvals.const";

/**
 * 거절 이유 고르기다. 정본은 `docs/2-design/system/screens/approvals.md`의 「거절 짜임」과
 * 「거절 문안」이다.
 *
 * **이유가 필수다.** 아무것도 안 고르면 「거절 보내기」가 안 눌린다 — 이유가 없으면 근무자가
 * 다시 요청할지 포기할지 정하지 못한다.
 *
 * **미리 놓은 문장이 먼저다.** 이유 셋과 직접 쓰는 글의 상한은
 * [`consts`](../consts/approvals.const.ts)가 든다.
 */
export function isRejectReasonValid(
  chosen: string | null,
  customText: string,
): boolean {
  if (chosen === null) {
    return false;
  }

  if (chosen !== CUSTOM_REJECT_REASON) {
    return true;
  }

  const written = customText.trim();

  return written.length > 0 && written.length <= CUSTOM_REJECT_MAX_LENGTH;
}

/** 실제로 근무자에게 갈 글이다 — 고른 문장이거나 직접 쓴 글이다. */
export function rejectReasonText(
  chosen: string | null,
  customText: string,
): string {
  if (chosen === CUSTOM_REJECT_REASON) {
    return customText.trim();
  }

  return (
    CANCEL_REJECT_REASONS.find((reason) => reason.value === chosen)?.label ?? ""
  );
}
