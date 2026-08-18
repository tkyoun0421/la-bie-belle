import type { ReactNode } from "react";

import { listNotifications } from "@/entities/notification/api/list-notifications";
import { AppHeader } from "@/widgets/app-shell/ui/AppHeader";
import { AppShellTabBar } from "@/widgets/app-shell/ui/AppShellTabBar";
import { OfflineBanner } from "@/widgets/offline/ui/OfflineBanner";

export default async function TabsLayout({
  children,
  sheet,
}: {
  children: ReactNode;
  sheet: ReactNode;
}) {
  const notificationsResult = await listNotifications();
  const hasUnreadNotifications = notificationsResult.ok && notificationsResult.unreadCount > 0;

  return (
    <>
      <AppHeader
        hasUnreadNotifications={hasUnreadNotifications}
        bannerSlot={<OfflineBanner variant="shell-row" />}
      />
      {children}
      {sheet}
      <AppShellTabBar />
    </>
  );
}
