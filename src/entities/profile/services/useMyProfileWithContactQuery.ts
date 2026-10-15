import type { DB } from "@/shared/api/database";
import type { MyProfile } from "@/entities/profile/model/profile.type";
import { useMyProfileQuery } from "@/entities/profile/services/useMyProfileQuery";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";

export type MyProfileWithContactResult = {
  data: MyProfile | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMyProfileWithContactQuery(
  client: DB,
  userId: string | null,
): MyProfileWithContactResult {
  const profile = useMyProfileQuery(client, userId);
  const profileId = profile.data?.id ?? null;
  const contact = useProfilePrivateQuery(client, profileId);

  return {
    data:
      profile.data && contact.data
        ? { ...profile.data, ...contact.data }
        : undefined,
    error: profile.error ?? contact.error,
    isLoading: profile.isLoading || (profileId !== null && contact.isLoading),
  };
}
