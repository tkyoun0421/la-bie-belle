import type { ReactNode } from "react";

import { listNotifications } from "@/entities/notification/api/list-notifications";
import { AppShellTabBar } from "@/widgets/app-shell/ui/AppShellTabBar";

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
      {children}
      {sheet}
      <AppShellTabBar hasUnreadNotifications={hasUnreadNotifications} />
    </>
  );
}
