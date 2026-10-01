/**
 * 거절 이유 고르기다. 정본은 `docs/2-design/system/screens/approvals.md`의 「거절 짜임」과
 * 「거절 문안」이다.
 *
 * **이유가 필수다.** 아무것도 안 고르면 「거절 보내기」가 안 눌린다 — 이유가 없으면 근무자가
 * 다시 요청할지 포기할지 정하지 못한다.
 *
 * **미리 놓은 문장이 먼저다.** 매번 처음부터 쓰게 하면 결국 한 글자짜리 이유가 간다.
 * 직접 쓰는 글은 근무자가 쓰는 취소 사유와 같은 100자까지고, 그 글이 알림 본문으로 그대로
 * 실려서 길면 폰 알림에서 잘린다.
 */

const CUSTOM_MAX_LENGTH = 100;

export const CUSTOM_REJECT_REASON = "custom";

/** 근무 취소 거절의 이유 셋이다. 마지막이 직접 쓰기다. */
export const CANCEL_REJECT_REASONS = [
  { value: "no_replacement", label: "그날 대신 나올 사람이 없어요" },
  { value: "too_soon", label: "근무가 코앞이라 어려워요" },
  { value: CUSTOM_REJECT_REASON, label: "직접 쓰기" },
] as const;

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

  return written.length > 0 && written.length <= CUSTOM_MAX_LENGTH;
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
