import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { resolveProfileAccess } from "@/entities/identity/model/profile-gate";
import { HOME_PATH } from "@/shared/config/auth-routes.config";
import { MotionProvider } from "@/shared/ui/motion-provider";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";
import { Providers } from "@/app/(protected)/providers";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const profileResult = await findOwnProfile();
  const access = resolveProfileAccess(profileResult, HOME_PATH);

  if (access.kind === "redirect") {
    redirect(access.to);
  }

  if (access.kind === "error") {
    return <ErrorScreen />;
  }

  return (
    <Providers>
      <MotionProvider>{children}</MotionProvider>
    </Providers>
  );
}
