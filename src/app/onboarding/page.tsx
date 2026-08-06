import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { HOME_PATH, LOGIN_PATH } from "@/shared/config/auth-routes.config";
import { OnboardingPlaceholderView } from "@/views/onboarding/ui/OnboardingPlaceholderView";

export default async function OnboardingPage() {
  const profileResult = await findOwnProfile();

  if (!profileResult.ok) {
    redirect(LOGIN_PATH);
  }

  if (profileResult.data) {
    redirect(HOME_PATH);
  }

  return <OnboardingPlaceholderView />;
}
