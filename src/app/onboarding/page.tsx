import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { resolveProfileGate } from "@/entities/identity/model/profile-gate";
import { submitSignup } from "@/features/signup/api/submit-signup";
import { LOGIN_PATH, ONBOARDING_PATH } from "@/shared/config/auth-routes.config";
import { OnboardingView } from "@/views/onboarding/ui/OnboardingView";

export default async function OnboardingPage() {
  const profileResult = await findOwnProfile();

  if (!profileResult.ok) {
    redirect(LOGIN_PATH);
  }

  const target = resolveProfileGate(profileResult.data, ONBOARDING_PATH);
  if (target !== null) {
    redirect(target);
  }

  return <OnboardingView action={submitSignup} />;
}
