import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { resolveProfileAccess } from "@/entities/identity/model/profile-gate";
import { DEPARTED_PATH } from "@/shared/config/auth-routes.config";
import { DepartedView } from "@/views/departed/ui/DepartedView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function DepartedPage() {
  const profileResult = await findOwnProfile();
  const access = resolveProfileAccess(profileResult, DEPARTED_PATH);

  if (access.kind === "redirect") {
    redirect(access.to);
  }

  if (access.kind === "error") {
    return <ErrorScreen />;
  }

  return <DepartedView />;
}
