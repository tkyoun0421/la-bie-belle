import type { GenderValue } from "@/entities/identity/model/signup";

const GENDER_LABELS: Record<GenderValue, string> = {
  male: "남성",
  female: "여성",
};

export function genderLabel(gender: GenderValue): string {
  return GENDER_LABELS[gender];
}
