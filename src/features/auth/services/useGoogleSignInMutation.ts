import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { DB } from "@/shared/api/database";
import { decideEntry } from "@/features/auth/lib/decideEntry.lib";
import { signInWithGoogle } from "@/features/auth/lib/signInWithGoogle.lib";
import type { GoogleSignInOutcome } from "@/features/auth/model/auth.type";

export type GoogleSignInMutationResult = {
  signIn: (onOutcome: (outcome: GoogleSignInOutcome) => void) => void;
  isPending: boolean;
};

async function signInAndDecide(client: DB): Promise<GoogleSignInOutcome> {
  try {
    const result = await signInWithGoogle({ client });

    if (result.ok) {
      return { kind: "decided", destination: await decideEntry({ client }) };
    }

    return result.reason === "cancelled"
      ? { kind: "cancelled" }
      : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

export function useGoogleSignInMutation(
  client: DB,
): GoogleSignInMutationResult {
  const [inFlight, setInFlight] = useState(false);
  const { mutate } = useMutation({
    mutationFn: () => signInAndDecide(client),
  });

  const signIn = useCallback(
    (onOutcome: (outcome: GoogleSignInOutcome) => void) => {
      if (inFlight) {
        return;
      }

      setInFlight(true);
      mutate(undefined, {
        onSuccess: (outcome) => onOutcome(outcome),
        onSettled: () => setInFlight(false),
      });
    },
    [inFlight, mutate],
  );

  return { signIn, isPending: inFlight };
}
