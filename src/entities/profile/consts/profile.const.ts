import type { ProfileGender } from "@/entities/profile/model/profile.schema";

export const NAME_GUIDE = "이름을 적어 주세요";

export const PHONE_GUIDE = "010으로 시작하는 11자리예요";

export const BIRTH_DATE_GUIDE = "숫자 8자리로 적어 주세요";

export const GENDER_GUIDE = "여 또는 남을 골라 주세요";

export const GENDER_LABEL: Record<ProfileGender, string> = {
  female: "여성",
  male: "남성",
};
