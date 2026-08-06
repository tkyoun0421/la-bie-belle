import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { OnboardingPlaceholderView } from "@/views/onboarding/ui/OnboardingPlaceholderView";

export default async function OnboardingPage() {
  const hasProfile = await findOwnProfile();

  if (hasProfile) {
    redirect("/");
  }

  return <OnboardingPlaceholderView />;
}
