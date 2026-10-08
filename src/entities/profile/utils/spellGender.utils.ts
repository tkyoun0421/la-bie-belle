import { GENDER_LABEL } from "@/entities/profile/consts/profile.const";
import { isProfileGender } from "@/entities/profile/model/profile.schema";

export function spellGender(gender: string | null): string {
  return isProfileGender(gender) ? GENDER_LABEL[gender] : "";
}
