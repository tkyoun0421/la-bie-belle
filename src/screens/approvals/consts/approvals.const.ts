/**
 * 승인 대기 화면의 정해진 값과 문안이다. 정본은
 * `docs/2-design/system/screens/approvals.md`의 「거절 짜임」과 「거절 문안」이다.
 *
 * **미리 놓은 문장이 먼저다.** 매번 처음부터 쓰게 하면 결국 한 글자짜리 이유가 간다.
 */

export const CUSTOM_REJECT_REASON = "custom";

/** 근무 취소 거절의 이유 셋이다. 마지막이 직접 쓰기다. */
export const CANCEL_REJECT_REASONS = [
  { value: "no_replacement", label: "그날 대신 나올 사람이 없어요" },
  { value: "too_soon", label: "근무가 코앞이라 어려워요" },
  { value: CUSTOM_REJECT_REASON, label: "직접 쓰기" },
] as const;

/**
 * 직접 쓰는 글의 상한이다 — 근무자가 쓰는 취소 사유와 같고, 그 글이 알림 본문으로 그대로
 * 실려서 길면 폰 알림에서 잘린다. 칸이 받는 길이와 판정이 보는 길이가 같아야 해서 한 벌이다.
 */
export const CUSTOM_REJECT_MAX_LENGTH = 100;
