import { supabase } from "@/shared/api/supabase";
import { fragmentOf } from "@/shared/model/fragmentState.policy";
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
  const read = useMyProfileQuery(supabase, userId);

  return fragmentOf(read, {
    ready: (profile) => ({
      name: profile.displayName ?? "",
      photoUrl: profile.photoUrl,
      roleLabel:
        profile.role === "admin"
          ? PROFILE_CARD_COPY.admin
          : PROFILE_CARD_COPY.worker,
      gender: spellGender(profile.gender),
      birthDate: profile.birthDate
        ? spellBirthDate(digitsOfBirthDate(profile.birthDate))
        : "",
      phone: profile.phone ?? "",
    }),
  });
}
