import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getProfilePrivate } from "@/entities/profile/api/profilePrivate.api";
import type { ProfilePrivate } from "@/entities/profile/model/profile.type";

export type ProfilePrivateResult = {
  data: ProfilePrivate | null | undefined;
  isLoading: boolean;
  error: Error | null;
};

export function useProfilePrivateQuery(
  client: DB,
  profileId: string | null,
): ProfilePrivateResult {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.profile.privateOf(profileId ?? ""),
    queryFn: () => getProfilePrivate(client, profileId ?? ""),
    enabled: profileId !== null,
  });

  return { data, isLoading, error };
}
