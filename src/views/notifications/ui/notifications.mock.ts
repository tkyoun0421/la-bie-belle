import {
  ALL_READ_NOTIFICATIONS,
  EMPTY_NOTIFICATIONS,
  MIXED_NOTIFICATIONS,
} from "@/entities/notification/model/notification-item.mock";

export const NOTIFICATIONS_NOW = new Date(2026, 7, 6, 12, 0, 0);

export const NOTIFICATIONS_MIXED = { items: MIXED_NOTIFICATIONS, now: NOTIFICATIONS_NOW };
export const NOTIFICATIONS_ALL_READ = { items: ALL_READ_NOTIFICATIONS, now: NOTIFICATIONS_NOW };
export const NOTIFICATIONS_EMPTY = { items: EMPTY_NOTIFICATIONS, now: NOTIFICATIONS_NOW };
