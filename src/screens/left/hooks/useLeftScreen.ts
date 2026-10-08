import { supabase } from "@/shared/api/supabase";
import type { SessionUser } from "@/entities/session/model/session.type";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";

export type LeftScreenController = {
  me: SessionUser | null | undefined;
  signOut: (onDone: () => void) => void;
  isPending: boolean;
};

export function useLeftScreen(): LeftScreenController {
  const { data: me } = useSessionUserQuery(supabase);
  const { signOut, isPending } = useSignOutMutation(supabase);

  return { me, signOut, isPending };
}
