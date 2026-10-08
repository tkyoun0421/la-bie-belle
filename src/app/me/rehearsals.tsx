import { Redirect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/shared/api/supabase";
import { useQualificationsQuery } from "@/entities/member/services/useQualificationsQuery";
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { hasRehearsalGrant } from "@/screens/profile/model/hasRehearsalGrant.policy";
import { resolveRehearsalGuard } from "@/screens/rehearsal/model/rehearsalGuard.policy";
import { RehearsalScreen } from "@/screens/rehearsal/ui/RehearsalScreen";

type RehearsalParams = {
  month?: string;
};

export default function Screen() {
  const { month } = useLocalSearchParams<RehearsalParams>();
  const { data: user, isLoading: asking } = useSessionUserQuery(supabase);
  const userId = user?.id ?? null;

  const { data: profile, isLoading: profileLoading } = useMyProfileRowQuery(
    supabase,
    userId,
  );
  const { data: grants, isLoading: grantsLoading } =
    useQualificationsQuery(supabase);

  const standing = resolveRehearsalGuard({
    isAdmin: profile?.role === "admin",
    hasGrant: hasRehearsalGrant(grants ?? [], profile?.id ?? null),
    isLoading: asking || (userId !== null && (profileLoading || grantsLoading)),
  });

  if (standing === "wait") {
    return null;
  }

  if (standing === "redirect-me") {
    return <Redirect href="/me" />;
  }

  return <RehearsalScreen month={month} />;
}
