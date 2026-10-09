import { isProfileGender } from "@/entities/profile/model/profile.schema";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import { SCHEDULE_ASSIGN_COPY } from "@/features/scheduleAssign/consts/scheduleAssign.const";
import type {
  PersonSheetController,
  PersonSheetInput,
} from "@/features/scheduleAssign/model/personSheet.type";
import {
  birthYearShort,
  genderSymbol,
  restrictedQualifications,
} from "@/features/scheduleAssign/utils/personSheet.utils";

export function usePersonSheet({
  name,
  photoUrl,
  gender,
  birthDate,
  qualifications,
}: PersonSheetInput): PersonSheetController {
  const known = isProfileGender(gender) ? gender : null;
  const facts = [
    known === null ? null : spellGender(known),
    birthDate === null ? null : birthYearShort(birthDate),
  ].filter((fact) => fact !== null);
  const earned = restrictedQualifications(qualifications);

  return {
    name,
    photoUrl,
    genderIcon: known === null ? null : genderSymbol(known),
    factsLine:
      facts.length === 0
        ? null
        : facts.join(SCHEDULE_ASSIGN_COPY.factSeparator),
    qualificationLine:
      earned.length === 0
        ? null
        : earned.join(SCHEDULE_ASSIGN_COPY.factSeparator),
  };
}
