import { useQuery } from "@tanstack/react-query";
import type { DB } from "@/shared/api/database";
import { queryKeys } from "@/shared/api/queryKeys";
import { getCurrentUser } from "@/entities/session/api/getCurrentUser.api";
import type { SessionUser } from "@/entities/session/model/session.type";
import { googlePhotoOf } from "@/entities/session/utils/googlePhotoOf.utils";

export function useSessionUserQuery(client: DB): {
  data: SessionUser | null | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.session.user(),
    queryFn: async (): Promise<SessionUser | null> => {
      const user = await getCurrentUser(client);

      return user === null
        ? null
        : {
            id: user.id,
            email: user.email ?? "",
            googlePhotoUrl: googlePhotoOf(user.user_metadata),
          };
    },
  });

  return { data, isLoading };
}
