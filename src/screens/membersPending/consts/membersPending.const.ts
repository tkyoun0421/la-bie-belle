export const PENDING_COPY = {
  appBarTitle: "가입 대기",
  more: "더보기",
  blockedMenu: "차단한 사람",
  empty: "기다리는 사람이 없어요",
} as const;

export const BLOCKED_COPY = {
  appBarTitle: "차단한 사람",
  empty: "차단한 사람이 없어요",
  unblock: "차단 풀기",
  confirmSuffix: " 님의 차단을 풀까요",
  confirmNote: "다시 로그인할 수 있게 돼요",
  unblockedSuffix: " 님의 차단을 풀었어요",
  close: "닫기",
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
} as const;

export const UNBLOCK_CONFIRM_TEST_ID = "members-pending-unblock-confirm";

export const PENDING_SKELETON_ROWS = [0, 1, 2];

export const BLOCKED_SKELETON_ROWS = [0, 1];

export const MORE_ICON_SIZE = 20;

export const MORE_HIT_SLOP = 8;
