import {
  ALL_READ_NOTIFICATIONS,
  EMPTY_NOTIFICATIONS,
  MIXED_NOTIFICATIONS,
} from "@/entities/notification/model/notification-item.mock";
import type { NotificationItem } from "@/entities/notification/model/notification-item";

export const NOTIFICATIONS_NOW = new Date(2026, 7, 6, 12, 0, 0);

function mockMarkRead(_item: NotificationItem) {}
function mockMarkAllRead() {}

export const NOTIFICATIONS_MIXED = {
  items: MIXED_NOTIFICATIONS,
  now: NOTIFICATIONS_NOW,
  onMarkRead: mockMarkRead,
  onMarkAllRead: mockMarkAllRead,
};
export const NOTIFICATIONS_ALL_READ = {
  items: ALL_READ_NOTIFICATIONS,
  now: NOTIFICATIONS_NOW,
  onMarkRead: mockMarkRead,
  onMarkAllRead: mockMarkAllRead,
};
export const NOTIFICATIONS_EMPTY = {
  items: EMPTY_NOTIFICATIONS,
  now: NOTIFICATIONS_NOW,
  onMarkRead: mockMarkRead,
  onMarkAllRead: mockMarkAllRead,
};
