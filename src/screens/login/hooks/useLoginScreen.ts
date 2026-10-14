import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import type { GoogleSignInOutcome } from "@/features/auth/model/auth.type";
import { useGoogleSignInMutation } from "@/features/auth/services/useGoogleSignInMutation";

export type LoginScreenController = {
  signIn: () => void;
  busy: boolean;
  failed: boolean;
};

export function useLoginScreen(): LoginScreenController {
  const router = useRouter();
  const { signIn: start, isPending } = useGoogleSignInMutation(supabase);
  const [failed, setFailed] = useState(false);

  const settle = useCallback(
    (outcome: GoogleSignInOutcome) => {
      if (outcome.kind === "decided") {
        router.replace(outcome.destination);
      } else if (outcome.kind === "failed") {
        setFailed(true);
      }
    },
    [router],
  );

  const signIn = useCallback(() => {
    setFailed(false);
    start(settle);
  }, [start, settle]);

  return { signIn, busy: isPending, failed };
}
