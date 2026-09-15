import type { SupabaseClient, User } from "@supabase/supabase-js";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/shared/lib/create-supabase-browser-client";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import {
  resolveAuthDestination,
  resolveGateMove,
  type AuthDestination,
  type ProfileStanding,
} from "@/shared/lib/resolve-auth-destination";
import { ensureProfile } from "@/entities/profile/dals/ensure-profile";
import {
  getMyProfile,
  type MyProfileRow,
} from "@/entities/profile/dals/get-my-profile";
import { googlePhotoOf } from "@/features/auth/google-photo-of";

const PROFILE_QUERY_KEY = ["profile"];

export type AuthGateStatus = "loading" | "ready" | "error";

export type AuthGateValue = {
  destination: AuthDestination | null;
  email: string | null;
  avatarUrl: string | null;
};

export type AuthGate = AuthGateValue & {
  status: AuthGateStatus;
  retry: () => void;
};

type SettledSession =
  | { attempt: number; phase: "error" }
  | { attempt: number; phase: "ready"; user: User | null };

type SessionPhase = SettledSession | { phase: "loading" };

export function profileQueryOptions(client: SupabaseClient, userId: string) {
  return queryOptions({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => getMyProfile(client, userId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

function standingOf(row: MyProfileRow | null): ProfileStanding | null {
  if (!row) {
    return null;
  }

  return {
    approvedAt: row.approved_at,
    blockedAt: row.blocked_at,
    leftAt: row.left_at,
  };
}

function useSessionPhase(
  client: SupabaseClient,
  attempt: number,
): SessionPhase {
  const [settled, setSettled] = useState<SettledSession | null>(null);

  useEffect(() => {
    let abandoned = false;

    void (async () => {
      try {
        const user = await getCurrentUser(client);

        if (user) {
          await ensureProfile(client);
        }

        if (!abandoned) {
          setSettled({ attempt, phase: "ready", user });
        }
      } catch {
        if (!abandoned) {
          setSettled({ attempt, phase: "error" });
        }
      }
    })();

    return () => {
      abandoned = true;
    };
  }, [client, attempt]);

  return settled?.attempt === attempt ? settled : { phase: "loading" };
}

export function useAuthGate(): AuthGate {
  const [client] = useState(createSupabaseBrowserClient);
  const [attempt, setAttempt] = useState(0);
  const session = useSessionPhase(client, attempt);

  const user = session.phase === "ready" ? session.user : null;
  const profile = useQuery({
    ...profileQueryOptions(client, user?.id ?? ""),
    enabled: user !== null,
  });

  const queryClient = useQueryClient();
  const retry = useCallback(() => {
    void queryClient.resetQueries({ queryKey: PROFILE_QUERY_KEY });
    setAttempt((count) => count + 1);
  }, [queryClient]);

  const { replace } = useRouter();
  const pathname = usePathname();

  const destination = destinationOf(session, profile.isSuccess, profile.data);
  const status = statusOf(session, profile.isError, destination);

  useEffect(() => {
    if (status !== "ready" || !destination) {
      return;
    }

    const move = resolveGateMove(destination, pathname);
    if (move) {
      replace(move);
    }
  }, [status, destination, pathname, replace]);

  return {
    status,
    destination,
    email: user?.email ?? null,
    avatarUrl: user ? googlePhotoOf(user.user_metadata) : null,
    retry,
  };
}

function destinationOf(
  session: SessionPhase,
  profileRead: boolean,
  row: MyProfileRow | null | undefined,
): AuthDestination | null {
  if (session.phase !== "ready") {
    return null;
  }

  if (!session.user) {
    return resolveAuthDestination({ hasSession: false, profile: null });
  }

  if (!profileRead) {
    return null;
  }

  return resolveAuthDestination({
    hasSession: true,
    profile: standingOf(row ?? null),
  });
}

function statusOf(
  session: SessionPhase,
  profileFailed: boolean,
  destination: AuthDestination | null,
): AuthGateStatus {
  if (session.phase === "error" || profileFailed) {
    return "error";
  }

  return destination ? "ready" : "loading";
}
