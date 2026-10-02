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

/**
 * 화면에 뜨는 글자다. 정본은 `docs/2-design/system/screens/approvals.md`의 「목록 문안」과
 * 「상세 시트 문안」과 「거절 문안」 표다.
 *
 * **`sendFailed`는 저장소를 가로지르는 사본 여섯 중 하나다** — 통신이 끊겼을 때의 기본
 * 문장이고 정본은 `docs/2-design/system/data-access.md`의 「오류의 모양」이다. 여기 한 벌을
 * 두는 것은 묶음 하나가 그 여섯을 못 접기 때문이다.
 */
export const APPROVALS_COPY = {
  appBarTitle: "승인할 일",
  emptyTitle: "승인할 일이 없어요",
  emptyBody: "사유나 근무 취소가 오면 여기 서요",
  cancelBadge: "근무 취소",
  reject: "거절",
  approve: "승인",
  rejectTitle: "거절하는 이유",
  reasonLabel: "이유",
  reasonPlaceholder: "근무자에게 보낼 말을 적어 주세요",
  reasonHint: "고른 문장이 근무자에게 그대로 가요",
  back: "뒤로",
  sendReject: "거절 보내기",
  sending: "보내는 중",
  resend: "다시 보내기",
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
  confirmTitle: "근무를 취소할까요?",
  confirmBack: "뒤로",
  confirmApprove: "취소 승인",
  confirmRetry: "다시 시도",
  rejected: "거절했어요",
};
