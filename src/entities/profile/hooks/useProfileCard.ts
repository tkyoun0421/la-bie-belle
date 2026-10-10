import { supabase } from "@/shared/api/supabase";
import { PROFILE_CARD_COPY } from "@/entities/profile/consts/profile.const";
import { useMyProfileQuery } from "@/entities/profile/services/useMyProfileQuery";
import {
  digitsOfBirthDate,
  spellBirthDate,
} from "@/entities/profile/utils/birthDateDigits.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";

export type ProfileCardInput = {
  userId: string | null;
};

export type ProfileCardController =
  | { state: "pending" }
  | { state: "failed" }
  | {
      state: "ready";
      name: string;
      photoUrl: string | null;
      roleLabel: string;
      gender: string;
      birthDate: string;
      phone: string;
    };

export function useProfileCard({
  userId,
}: ProfileCardInput): ProfileCardController {
  const { data, error } = useMyProfileQuery(supabase, userId);

  if (error !== null) {
    return { state: "failed" };
  }

  if (data === undefined) {
    return { state: "pending" };
  }

  return {
    state: "ready",
    name: data.displayName ?? "",
    photoUrl: data.photoUrl,
    roleLabel:
      data.role === "admin"
        ? PROFILE_CARD_COPY.admin
        : PROFILE_CARD_COPY.worker,
    gender: spellGender(data.gender),
    birthDate: data.birthDate
      ? spellBirthDate(digitsOfBirthDate(data.birthDate))
      : "",
    phone: data.phone ?? "",
  };
}
