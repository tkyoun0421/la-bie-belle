import { useCallback } from "react";
import { supabase } from "@/shared/api/supabase";
import type { SessionUser } from "@/entities/session/model/session.type";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import type { EntryDecision } from "@/features/auth/model/auth.type";
import { useRetryEntryMutation } from "@/features/auth/services/useRetryEntryMutation";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";

type RetryRouter = { replace: (href: EntryDecision) => void };

export type RetryScreenController = {
  me: SessionUser | null | undefined;
  retry: () => void;
  retrying: boolean;
  signOut: (onDone: () => void) => void;
  signingOut: boolean;
};

export function useRetryScreen(router: RetryRouter): RetryScreenController {
  const { data: me } = useSessionUserQuery(supabase);
  const { signOut, isPending: signingOut } = useSignOutMutation(supabase);

  const { retry: decide, isPending } = useRetryEntryMutation(supabase);

  const retry = useCallback(() => {
    decide((destination) => {
      if (destination !== "/retry") {
        router.replace(destination);
      }
    });
  }, [decide, router]);

  return { me, retry, retrying: isPending, signOut, signingOut };
}
