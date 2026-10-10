import { Redirect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/shared/api/supabase";
import { resolveRehearsalGuard } from "@/shared/model/rehearsalGuard.policy";
import { hasRehearsalGrant } from "@/entities/member/model/hasRehearsalGrant.policy";
import { useQualificationsQuery } from "@/entities/member/services/useQualificationsQuery";
import { useMyStanding } from "@/features/auth/hooks/useMyStanding";
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
