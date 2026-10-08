import type { Theme } from "@/shared/model/theme.type";

export const THEME_LABEL: Record<Theme, string> = {
  system: "기기 설정대로",
  light: "밝게",
  dark: "어둡게",
};

export const THEME_CHOICES: readonly Theme[] = ["system", "light", "dark"];

export const PROFILE_COPY = {
  appBarTitle: "나",
  admin: "관리자",
  worker: "근무자",
  lockedNote: "이름·성별·생년월일은 관리자가 고쳐요",
  editPhoto: "사진 고치기",
  genderLabel: "성별",
  birthDateLabel: "생년월일",
  contactLabel: "연락처",
  notificationLabel: "알림",
  themeLabel: "화면",
  statsLabel: "통계",
  rehearsalLabel: "리허설",
  adminModeLabel: "관리자 모드",
  signOut: "로그아웃",
  contactSaved: "연락처를 바꿨어요",
  photoSaved: "사진을 바꿨어요",
  turnOffTitle: "알림을 끌까요?",
  turnOffNote: "근무표가 확정되거나 근무 요청이 와도 알림이 안 와요",
  turnOffClose: "닫기",
  turnOffConfirm: "알림 끄기",
} as const;

export const CONTACT_SHEET_COPY = {
  title: "연락처",
  inputLabel: "휴대폰 번호",
  placeholder: "01012345678",
  guide: "숫자만 적으면 돼요",
  invalid: "010으로 시작하는 11자리를 적어 주세요",
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
  close: "닫기",
  save: "저장",
} as const;

export const PHOTO_SHEET_COPY = {
  title: "사진",
  pick: "사진 고르기",
  useGoogle: "구글 사진으로",
  close: "닫기",
  failed: "사진을 올리지 못했어요. 다시 골라 주세요",
} as const;

export const THEME_SHEET_TITLE = "화면";

export const PHONE_LENGTH = 11;

export const AVATAR_SIZE = 88;

export const PENCIL_ICON_SIZE = 14;

export const PENCIL_HIT_SLOP = 8;
