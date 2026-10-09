import { useRouter } from "expo-router";
import { useCallback } from "react";
import { supabase } from "@/shared/api/supabase";
import { LOGIN_PATH } from "@/shared/consts/navigation.const";
import type { SessionUser } from "@/entities/session/model/session.type";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { useRetryEntryMutation } from "@/features/auth/services/useRetryEntryMutation";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";
import { RETRY_PATH } from "@/screens/retry/consts/retry.const";

export type RetryScreenController = {
  me: SessionUser | null | undefined;
  email: string;
  photoUrl: string | null;
  retry: () => void;
  retrying: boolean;
  signOut: (onDone: () => void) => void;
  signingOut: boolean;
  goLogin: () => void;
};

export function useRetryScreen(): RetryScreenController {
  const router = useRouter();
  const { data: me } = useSessionUserQuery(supabase);
  const { signOut, isPending: signingOut } = useSignOutMutation(supabase);

  const { retry: decide, isPending } = useRetryEntryMutation(supabase);

  const retry = useCallback(() => {
    decide((destination) => {
      if (destination !== RETRY_PATH) {
        router.replace(destination);
      }
    });
  }, [decide, router]);

  const goLogin = useCallback(() => router.replace(LOGIN_PATH), [router]);

  return {
    me,
    email: me?.email ?? "",
    photoUrl: me?.googlePhotoUrl ?? null,
    retry,
    retrying: isPending,
    signOut,
    signingOut,
    goLogin,
  };
}
