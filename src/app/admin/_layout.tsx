import { Redirect, Stack } from "expo-router";
import { supabase } from "@/shared/api/supabase";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { resolveAdminGuard } from "@/entities/session/model/resolveAdminGuard.policy";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";

export default function AdminLayout() {
  const { data: user, isLoading: asking } = useSessionUserQuery(supabase);
  const userId = user?.id ?? null;

  const { data: profile, isLoading: reading } = useMyProfileRowQuery(
    supabase,
    userId,
  );

  const read = !asking && (userId === null || !reading);
  const move = resolveAdminGuard(profile ?? null);

  if (!read) {
    return null;
  }

  if (move) {
    return <Redirect href={move} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
