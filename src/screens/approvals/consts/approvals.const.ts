export const CUSTOM_REJECT_REASON = "custom";

export const CANCEL_REJECT_REASONS = [
  { value: "no_replacement", label: "그날 대신 나올 사람이 없어요" },
  { value: "too_soon", label: "근무가 코앞이라 어려워요" },
  { value: CUSTOM_REJECT_REASON, label: "직접 쓰기" },
] as const;

export const CUSTOM_REJECT_MAX_LENGTH = 100;

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
