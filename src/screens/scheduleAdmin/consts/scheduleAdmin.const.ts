export const EMPTY_ICON_SIZE = 44;

export const SCHEDULE_ADMIN_COPY = {
  stopPicking: "그만두기",
  pickingTitle: "열 날을 고르세요",
  startPicking: "날 열기",
  confirmedBadge: "확정",
  pickingHint: "닫힌 날만 고를 수 있어요",
  allClosed: "전부 닫힌 날이에요. 예식 있는 날을 열어주세요",
  applicationsHint: "사람 표시는 근무 신청이에요",
  applicationsPrefix: "근무 신청 ",
  applicationsSuffix: "건 모아보기",
  monthMissing: " 근무표가 없어요",
  monthNotYet: " 근무표가 아직 없어요",
  createHintPrefix: "만들면 근무자들이 ",
  createHintSuffix: " 근무 신청을 넣을 수 있어요",
  createSuffix: " 근무표 만들기",
  confirmLocked: "확정하기",
  confirmSuffix: " 근무표 확정하기",
  pullDeadline: "· 마감일 당기기",
  arrivedFromApprovals: "근무를 취소했어요",
  holidayLabel: "임시공휴일",
  adjustLabel: "근무 조정",
  closeDay: "이 날 닫기",
  discardZoneLabel: "여기에 놓으면 자리를 지워요",
  discardZoneActiveLabel: "놓으면 지워져요",
  mergeInstead: "겸임은 자리를 합쳐 만드세요",
  emptySlotLine: "비어 있어요",
  mergedPositionSeparator: "·",
} as const;

export const ADJUSTMENT_REASON = {
  absence: "결근",
  extra: "연장",
  revert: "원래대로",
} as const;

export const DISCARD_DROP_ID = "discard";
