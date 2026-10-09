import { useRouter } from "expo-router";
import { useCallback } from "react";
import { supabase } from "@/shared/api/supabase";
import { LOGIN_PATH, PAYROLL_PATH } from "@/shared/consts/navigation.const";
import type { SessionUser } from "@/entities/session/model/session.type";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";

export type LeftScreenController = {
  me: SessionUser | null | undefined;
  email: string;
  photoUrl: string | null;
  signOut: (onDone: () => void) => void;
  isPending: boolean;
  goLogin: () => void;
  openPayroll: () => void;
};

export function useLeftScreen(): LeftScreenController {
  const router = useRouter();
  const { data: me } = useSessionUserQuery(supabase);
  const { signOut, isPending } = useSignOutMutation(supabase);

  const goLogin = useCallback(() => router.replace(LOGIN_PATH), [router]);
  const openPayroll = useCallback(() => router.push(PAYROLL_PATH), [router]);

  return {
    me,
    email: me?.email ?? "",
    photoUrl: me?.googlePhotoUrl ?? null,
    signOut,
    isPending,
    goLogin,
    openPayroll,
  };
}
