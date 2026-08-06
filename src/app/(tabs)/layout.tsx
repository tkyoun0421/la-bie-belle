import type { ReactNode } from "react";

import { MIXED_NOTIFICATIONS } from "@/entities/notification/model/notification-item.mock";
import { AppShellTabBar } from "@/widgets/app-shell/ui/AppShellTabBar";

export default function TabsLayout({ children }: { children: ReactNode }) {
  const hasUnreadNotifications = MIXED_NOTIFICATIONS.some((item) => !item.read);

  return (
    <>
      {children}
      <AppShellTabBar hasUnreadNotifications={hasUnreadNotifications} />
    </>
  );
}
