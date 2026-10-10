import type { DB } from "@/shared/api/database";
import type { Profile } from "@/entities/profile/model/profile.type";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import type { SessionUser } from "@/entities/session/model/session.type";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";

export type MyStanding = {
  user: SessionUser | null | undefined;
  userId: string | null;
  profile: Profile | null | undefined;
  role: string | undefined;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
};

export function useMyStanding(client: DB): MyStanding {
  const session = useSessionUserQuery(client);
  const userId = session.data?.id ?? null;
  const profile = useMyProfileRowQuery(client, userId);
  const role = profile.data?.role;

  return {
    user: session.data,
    userId,
    profile: profile.data,
    role,
    isAdmin: role === "admin",
    isLoading: session.isLoading || (userId !== null && profile.isLoading),
    error: profile.error,
  };
}
