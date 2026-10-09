import type { ProfileGender } from "@/entities/profile/model/profile.schema";
import { RESTRICTED_POSITIONS } from "@/features/scheduleAssign/consts/scheduleAssign.const";

export type GenderSymbol = "Venus" | "Mars";

const BIRTH_YEAR_DIGITS = 2;

export function genderSymbol(gender: ProfileGender): GenderSymbol {
  return gender === "female" ? "Venus" : "Mars";
}

export function birthYearShort(birthDate: string): string {
  return `${birthDate.slice(4 - BIRTH_YEAR_DIGITS, 4)}년생`;
}

export function restrictedQualifications(
  positions: readonly string[],
): string[] {
  return RESTRICTED_POSITIONS.filter((restricted) =>
    positions.includes(restricted),
  );
}
