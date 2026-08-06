import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { resolveProfileGate } from "@/entities/identity/model/profile-gate";
import { LOGIN_PATH, PENDING_PATH } from "@/shared/config/auth-routes.config";
import { PendingView } from "@/views/pending/ui/PendingView";

export default async function PendingPage() {
  const profileResult = await findOwnProfile();

  if (!profileResult.ok) {
    redirect(LOGIN_PATH);
  }

  const target = resolveProfileGate(profileResult.data, PENDING_PATH);
  if (target !== null) {
    redirect(target);
  }

  return <PendingView />;
}
