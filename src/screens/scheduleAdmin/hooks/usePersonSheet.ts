import { isProfileGender } from "@/entities/profile/model/profile.schema";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import { SCHEDULE_ADMIN_SHEET_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type {
  PersonSheetController,
  PersonSheetInput,
} from "@/screens/scheduleAdmin/model/personSheet.type";
import {
  birthYearShort,
  genderSymbol,
  restrictedQualifications,
} from "@/screens/scheduleAdmin/utils/personSheet.utils";

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
        : facts.join(SCHEDULE_ADMIN_SHEET_COPY.factSeparator),
    qualificationLine:
      earned.length === 0
        ? null
        : earned.join(SCHEDULE_ADMIN_SHEET_COPY.factSeparator),
  };
}
