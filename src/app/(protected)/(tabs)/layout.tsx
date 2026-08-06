import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { findOwnProfile } from "@/entities/identity/api/find-own-profile";
import { resolveProfileGate } from "@/entities/identity/model/profile-gate";
import { MIXED_NOTIFICATIONS } from "@/entities/notification/model/notification-item.mock";
import { HOME_PATH, LOGIN_PATH } from "@/shared/config/auth-routes.config";
import { AppShellTabBar } from "@/widgets/app-shell/ui/AppShellTabBar";

export default async function TabsLayout({ children }: { children: ReactNode }) {
  const profileResult = await findOwnProfile();

  if (!profileResult.ok) {
    redirect(LOGIN_PATH);
  }

  const target = resolveProfileGate(profileResult.data, HOME_PATH);
  if (target !== null) {
    redirect(target);
  }

  const hasUnreadNotifications = MIXED_NOTIFICATIONS.some((item) => !item.read);

  return (
    <>
      {children}
      <AppShellTabBar hasUnreadNotifications={hasUnreadNotifications} />
    </>
  );
}
