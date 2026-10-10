import { Redirect, Stack } from "expo-router";
import { supabase } from "@/shared/api/supabase";
import { resolveAdminGuard } from "@/entities/session/model/resolveAdminGuard.policy";
import { useMyStanding } from "@/features/auth/hooks/useMyStanding";

export default function AdminLayout() {
  const { profile, isLoading } = useMyStanding(supabase);

  if (isLoading) {
    return null;
  }

  const move = resolveAdminGuard(profile ?? null);

  if (move) {
    return <Redirect href={move} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
