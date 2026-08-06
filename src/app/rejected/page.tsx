import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { resolveProfileAccess } from "@/entities/identity/model/profile-gate";
import { REJECTED_PATH } from "@/shared/config/auth-routes.config";
import { RejectedView } from "@/views/rejected/ui/RejectedView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function RejectedPage() {
  const profileResult = await findOwnProfile();
  const access = resolveProfileAccess(profileResult, REJECTED_PATH);

  if (access.kind === "redirect") {
    redirect(access.to);
  }

  if (access.kind === "error") {
    return <ErrorScreen />;
  }

  return <RejectedView />;
}
