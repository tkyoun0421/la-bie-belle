import { skipToken, useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getMyProfile } from "@/entities/profile/api/getMyProfile.api";
import type { Profile } from "@/entities/profile/model/profile.type";

export type MyProfileRowResult = {
  data: Profile | null | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function useMyProfileRowQuery(
  client: DB,
  userId: string | null,
): MyProfileRowResult {
  const { data, error, isPending } = useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: userId === null ? skipToken : () => getMyProfile(client, userId),
  });

  return { data, error, isLoading: isPending };
}
