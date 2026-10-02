import type { Theme } from "@/shared/model/theme.type";

/** 테마 셋의 이름이다 — 줄의 오른쪽 값과 시트의 선택지가 같은 말을 쓴다. */
export const THEME_LABEL: Record<Theme, string> = {
  system: "기기 설정대로",
  light: "밝게",
  dark: "어둡게",
};

/** 시트에 서는 순서다 — 기기 설정이 기본값이라 맨 위다. */
export const THEME_CHOICES: readonly Theme[] = ["system", "light", "dark"];

/**
 * 「나」 화면의 문안이다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`의 「문안」이다.
 */
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

/** 연락처 시트의 문안이다 — 칸 하나에 도움말과 오류가 번갈아 선다. */
export const CONTACT_SHEET_COPY = {
  title: "연락처",
  inputLabel: "휴대폰 번호",
  placeholder: "01012345678",
  guide: "숫자만 적으면 돼요",
  invalid: "010으로 시작하는 11자리를 적어 주세요",
  /**
   * **같은 글자가 저장소 여섯 자리에 있다.** 묶음 다섯에 걸려 한 열이 못 접고 AC-13이
   * 받는다.
   */
  sendFailed: "보내지 못했어요. 다시 시도해주세요",
  close: "닫기",
  save: "저장",
} as const;

/** 사진 시트의 문안이다 — 줄 셋 중 가운데는 되돌아갈 자리가 있을 때만 선다. */
export const PHOTO_SHEET_COPY = {
  title: "사진",
  pick: "사진 고르기",
  useGoogle: "구글 사진으로",
  close: "닫기",
  failed: "사진을 올리지 못했어요. 다시 골라 주세요",
} as const;

/** 화면 시트의 제목이다 — 선택지 이름은 `THEME_LABEL`이 든다. */
export const THEME_SHEET_TITLE = "화면";

/** 전화번호 칸이 받는 자릿수다 — 하이픈 없는 숫자다. */
export const PHONE_LENGTH = 11;

/** 「나」의 큰 원이다. */
export const AVATAR_SIZE = 88;

export const PENCIL_ICON_SIZE = 14;

export const PENCIL_HIT_SLOP = 8;
