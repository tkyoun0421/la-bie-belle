"use client";

import { addTransitionType, startTransition } from "react";
import { useRouter } from "next/navigation";

import { RouteTransition } from "@/shared/ui/route-transition";
import { NotificationsView } from "@/views/notifications/ui/NotificationsView";
import { NOTIFICATIONS_MIXED } from "@/views/notifications/ui/notifications.mock";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <RouteTransition>
      <NotificationsView
        {...NOTIFICATIONS_MIXED}
        onNavigate={(item) => {
          const destination =
            item.target.screen === "schedule-detail" ? `/schedule/${item.target.date}` : "/pay";
          startTransition(() => {
            addTransitionType?.("nav-forward");
            router.push(destination);
          });
        }}
      />
    </RouteTransition>
  );
}
