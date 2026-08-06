import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { resolveProfileAccess } from "@/entities/identity/model/profile-gate";
import { submitSignup } from "@/features/signup/api/submit-signup";
import { ONBOARDING_PATH } from "@/shared/config/auth-routes.config";
import { OnboardingView } from "@/views/onboarding/ui/OnboardingView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function OnboardingPage() {
  const profileResult = await findOwnProfile();
  const access = resolveProfileAccess(profileResult, ONBOARDING_PATH);

  if (access.kind === "redirect") {
    redirect(access.to);
  }

  if (access.kind === "error") {
    return <ErrorScreen />;
  }

  return <OnboardingView action={submitSignup} />;
}
