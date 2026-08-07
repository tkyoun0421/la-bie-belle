import type { GenderValue } from "@/entities/identity/model/signup";

export const GENDER_REQUIREMENT_VALUES = ["any", "male", "female"] as const;
export type GenderRequirement = (typeof GENDER_REQUIREMENT_VALUES)[number];

export function matchesGenderRequirement(
  requirement: GenderRequirement,
  workerGender: GenderValue,
): boolean {
  return requirement === "any" || requirement === workerGender;
}
