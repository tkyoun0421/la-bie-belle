"use client";

import { useRouter } from "next/navigation";

import { NotificationsView } from "@/views/notifications/ui/NotificationsView";
import { NOTIFICATIONS_MIXED } from "@/views/notifications/ui/notifications.mock";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <NotificationsView
      {...NOTIFICATIONS_MIXED}
      onNavigate={(item) => {
        router.push(
          item.target.screen === "schedule-detail" ? `/schedule/${item.target.date}` : "/pay",
        );
      }}
    />
  );
}
