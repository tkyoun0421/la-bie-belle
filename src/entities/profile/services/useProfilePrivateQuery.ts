import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import type { ProfilePrivateRow } from "@/entities/profile/api/profile.dto";
import { getProfilePrivate } from "@/entities/profile/api/profilePrivate.api";

export type ProfilePrivateResult = {
  data: ProfilePrivateRow | null | undefined;
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
