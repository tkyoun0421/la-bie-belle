import {
  MEMBER_DECISION_COPY,
  MEMBER_LIST_COPY,
} from "@/entities/member/consts/member.const";

export const HANDLED_CODES: readonly string[] = [
  "has_future_assignments",
  "last_admin",
  "already_decided",
];

export const MEMBER_SHEET_COPY = {
  more: "더보기",
  adminBadge: MEMBER_LIST_COPY.adminBadge,
  markLeave: "퇴사 처리",
  undoLeave: "퇴사 되돌리기",
  leftSuffix: "에 퇴사했어요",
  erased: "1년이 지나 연락처와 사진은 지웠어요",
  nameLabel: "이름",
  renameNote: "지난 근무표와 급여에 뜨는 이름도 같이 바뀌어요",
  phoneLabel: "연락처",
  genderLabel: "성별",
  birthLabel: "생년월일",
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
  back: "뒤로",
  save: "저장",
  rename: "이름 고치기",
  demote: "관리자에서 내리기",
  promote: "관리자로 올리기",
  lastAdminNote: "관리자가 한 명뿐이라 내릴 수 없어요",
} as const;

export const MEMBER_SHEET_TOAST = {
  nameChanged: "이름을 바꿨어요",
  promoted: "관리자로 올렸어요",
  demoted: "관리자에서 내렸어요",
  leaveDone: "퇴사 처리했어요",
  undoDone: "퇴사를 되돌렸어요",
  alreadyDecided: MEMBER_DECISION_COPY.alreadyDecided,
} as const;

export const DETAIL_SHEET_COPY = {
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

export const DECISION_COPY = {
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

export const DETAIL_SHEET_TOAST = {
  alreadyDecided: MEMBER_DECISION_COPY.alreadyDecided,
  approvedSuffix: " 님을 승인했어요",
  rejectedSuffix: " 님을 안 받았어요",
  blockedSuffix: " 님을 차단했어요",
} as const;

export const MORE_TEST_ID = "members-sheet-more";

export const RENAME_INPUT_TEST_ID = "members-rename-input";

export const MARK_LEAVE_CONFIRM_TEST_ID = "members-mark-leave-confirm";

export const SHEET_AVATAR_SIZE = 64;

export const MORE_ICON_SIZE = 20;

export const MORE_HIT_SLOP = 8;

export const PHONE_ICON_SIZE = 18;
