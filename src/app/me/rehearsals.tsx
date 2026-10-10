import { Redirect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/shared/api/supabase";
import { useQualificationsQuery } from "@/entities/member/services/useQualificationsQuery";
import { useMyStanding } from "@/features/auth/hooks/useMyStanding";
import { hasRehearsalGrant } from "@/screens/profile/model/hasRehearsalGrant.policy";
import { resolveRehearsalGuard } from "@/screens/rehearsal/model/rehearsalGuard.policy";
import { RehearsalScreen } from "@/screens/rehearsal/ui/RehearsalScreen";

type RehearsalParams = {
  month?: string;
};

export default function Screen() {
  const { month } = useLocalSearchParams<RehearsalParams>();
  const { userId, profile, isAdmin, isLoading } = useMyStanding(supabase);
  const { data: grants, isLoading: grantsLoading } =
    useQualificationsQuery(supabase);

  const standing = resolveRehearsalGuard({
    isAdmin,
    hasGrant: hasRehearsalGrant(grants ?? [], profile?.id ?? null),
    isLoading: isLoading || (userId !== null && grantsLoading),
  });

  if (standing === "wait") {
    return null;
  }

  if (standing === "redirect-me") {
    return <Redirect href="/me" />;
  }

  return <RehearsalScreen month={month} />;
}
