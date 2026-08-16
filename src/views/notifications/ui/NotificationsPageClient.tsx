"use client";

import { addTransitionType, startTransition } from "react";
import { useRouter } from "next/navigation";

import type { NotificationItem } from "@/entities/notification/model/notification-item";
import { resolveNotificationPath } from "@/entities/notification/model/notification-path";
import { NotificationsView } from "@/views/notifications/ui/NotificationsView";

type NotificationsPageClientProps = {
  items: readonly NotificationItem[];
  now: Date;
  onMarkRead: (notificationId: string) => Promise<unknown>;
  onMarkAllRead: () => Promise<unknown>;
};

export function NotificationsPageClient({
  items,
  now,
  onMarkRead,
  onMarkAllRead,
}: NotificationsPageClientProps) {
  const router = useRouter();

  function handleNavigate(item: NotificationItem) {
    const destination = resolveNotificationPath(item.target);
    startTransition(() => {
      addTransitionType?.("nav-forward");
      router.push(destination);
    });
  }

  function handleMarkRead(item: NotificationItem) {
    void onMarkRead(item.id);
  }

  function handleMarkAllRead() {
    void onMarkAllRead();
  }

  return (
    <NotificationsView
      items={items}
      now={now}
      onNavigate={handleNavigate}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
    />
  );
}
