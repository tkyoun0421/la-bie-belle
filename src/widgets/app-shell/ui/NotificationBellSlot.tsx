"use client";

import { use } from "react";

import {
  hasUnreadNotifications,
  type ListNotificationsResult,
} from "@/widgets/app-shell/model/notification-bell";
import { NotificationBell } from "@/widgets/app-shell/ui/NotificationBell";

type NotificationBellSlotProps = {
  notificationsPromise: Promise<ListNotificationsResult>;
};

export function NotificationBellSlot({ notificationsPromise }: NotificationBellSlotProps) {
  const result = use(notificationsPromise);

  return <NotificationBell hasUnread={hasUnreadNotifications(result)} />;
}
