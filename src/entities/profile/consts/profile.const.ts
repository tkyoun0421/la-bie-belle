import type { ProfileGender } from "@/entities/profile/model/profile.schema";

export const NAME_GUIDE = "이름을 적어 주세요";

export const PHONE_GUIDE = "010으로 시작하는 11자리예요";

export const BIRTH_DATE_GUIDE = "숫자 8자리로 적어 주세요";

export const GENDER_GUIDE = "여 또는 남을 골라 주세요";

export const GENDER_LABEL: Record<ProfileGender, string> = {
  female: "여성",
  male: "남성",
};

export const PROFILE_CARD_COPY = {
  admin: "관리자",
  worker: "근무자",
  lockedNote: "이름·성별·생년월일은 관리자가 고쳐요",
  editPhoto: "사진 고치기",
  genderLabel: "성별",
  birthDateLabel: "생년월일",
  contactLabel: "연락처",
} as const;

export const CARD_AVATAR_SIZE = 88;

export const PENCIL_ICON_SIZE = 14;

export const PENCIL_HIT_SLOP = 8;
