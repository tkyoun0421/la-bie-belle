/**
 * 가입 대기와 차단한 사람 화면이 쓰는 문안과 정해진 값이다. 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`의 「문안」이다.
 */

export const PENDING_COPY = {
  appBarTitle: "가입 대기",
  more: "더보기",
  blockedMenu: "차단한 사람",
  empty: "기다리는 사람이 없어요",
  alreadyDecided: "이미 처리된 사람이에요",
  approvedSuffix: " 님을 승인했어요",
  rejectedSuffix: " 님을 안 받았어요",
  blockedSuffix: " 님을 차단했어요",
} as const;

export const BLOCKED_COPY = {
  appBarTitle: "차단한 사람",
  empty: "차단한 사람이 없어요",
  unblock: "차단 풀기",
  confirmSuffix: " 님의 차단을 풀까요",
  confirmNote: "다시 로그인할 수 있게 돼요",
  unblockedSuffix: " 님의 차단을 풀었어요",
  close: "닫기",
  /**
   * **같은 글자가 저장소 여섯 자리에 있다.** 묶음 다섯에 걸려 한 열이 못 접고 AC-13이
   * 받는다.
   */
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
} as const;

export const SHEET_COPY = {
  more: "더보기",
  blockMenu: "차단하기",
  genderLabel: "성별",
  birthLabel: "생년월일",
  phoneLabel: "연락처",
  emailLabel: "구글 계정",
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
  close: "닫기",
  reject: "거절",
  approve: "승인",
} as const;

/**
 * 거절과 차단이 묻는 말이다. 둘이 한 표에 드는 것은 시트가 같은 자리를 물음으로 바꿔
 * 쓰기 때문이다 — 얼굴 이름이 그대로 열쇠다.
 */
export const CONFIRM_COPY = {
  reject: {
    questionSuffix: " 님을 안 받을까요",
    note: "다시 보내면 목록에 또 떠요",
    action: "거절",
  },
  block: {
    questionSuffix: " 님을 차단할까요",
    note: "이 구글 계정으로는 다시 못 들어와요",
    action: "차단",
  },
} as const;

export const UNBLOCK_CONFIRM_TEST_ID = "members-pending-unblock-confirm";

/** 시트 맨 위 동그란 사진의 지름이다. */
export const SHEET_AVATAR_SIZE = 64;

export const MORE_ICON_SIZE = 20;

export const MORE_HIT_SLOP = 8;
