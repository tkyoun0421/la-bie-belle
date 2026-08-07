import { redirect } from "next/navigation";

import { findOwnDormancyProfile } from "@/entities/identity/api/find-own-dormancy";
import { resolveProfileAccess } from "@/entities/identity/model/profile-gate";
import { reactivateOwnProfile } from "@/features/reactivation/api/reactivate-own";
import { DORMANT_PATH } from "@/shared/config/auth-routes.config";
import { DormantView } from "@/views/dormant/ui/DormantView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function DormantPage() {
  const profileResult = await findOwnDormancyProfile();
  const access = resolveProfileAccess(profileResult, DORMANT_PATH);

  if (access.kind === "redirect") {
    redirect(access.to);
  }

  if (access.kind === "error") {
    return <ErrorScreen />;
  }

  if (
    !profileResult.ok ||
    profileResult.data === null ||
    profileResult.data.inactivityAnchorAt === null
  ) {
    return <ErrorScreen />;
  }

  return (
    <DormantView
      inactivityAnchorAt={profileResult.data.inactivityAnchorAt}
      onReactivate={reactivateOwnProfile}
    />
  );
}
