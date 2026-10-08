import type { DB } from "@/shared/api/database";
import type { MyProfile } from "@/entities/profile/model/profile.type";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";

export type MyProfileResult = {
  data: MyProfile | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMyProfileQuery(
  client: DB,
  userId: string | null,
): MyProfileResult {
  const profile = useMyProfileRowQuery(client, userId);
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
