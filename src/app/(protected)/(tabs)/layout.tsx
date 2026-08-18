import type { ReactNode } from "react";
import { Suspense } from "react";

import { listNotifications } from "@/entities/notification/api/list-notifications";
import { AppHeader } from "@/widgets/app-shell/ui/AppHeader";
import { AppShellTabBar } from "@/widgets/app-shell/ui/AppShellTabBar";
import { NotificationBell } from "@/widgets/app-shell/ui/NotificationBell";
import { NotificationBellSlot } from "@/widgets/app-shell/ui/NotificationBellSlot";
import { OfflineBanner } from "@/widgets/offline/ui/OfflineBanner";

export default async function TabsLayout({
  children,
  sheet,
}: {
  children: ReactNode;
  sheet: ReactNode;
}) {
  const notificationsPromise = listNotifications();

  return (
    <>
      <AppHeader
        bellSlot={
          <Suspense fallback={<NotificationBell hasUnread={false} />}>
            <NotificationBellSlot notificationsPromise={notificationsPromise} />
          </Suspense>
        }
        bannerSlot={<OfflineBanner variant="shell-row" />}
      />
      {children}
      {sheet}
      <AppShellTabBar />
    </>
  );
}
