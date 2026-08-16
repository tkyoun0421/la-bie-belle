import "server-only";

import type {
  NotificationItem,
  NotificationTarget,
} from "@/entities/notification/model/notification-item";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";

const LIST_NOTIFICATIONS_LIMIT = 1000;
const NOTIFICATION_MONTH_PATTERN = /^\d{4}-\d{2}$/;

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  target: unknown;
};

export type ListNotificationsResult =
  { ok: true; items: NotificationItem[]; unreadCount: number } | { ok: false; code: ErrorCode };

function parseTarget(raw: unknown): NotificationTarget | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const value = raw as Record<string, unknown>;

  if (value.screen === "schedule-detail" && typeof value.date === "string") {
    return { screen: "schedule-detail", date: value.date };
  }

  if (
    value.screen === "schedule" &&
    typeof value.month === "string" &&
    NOTIFICATION_MONTH_PATTERN.test(value.month)
  ) {
    return { screen: "schedule", month: value.month };
  }

  if (value.screen === "pay") {
    return { screen: "pay" };
  }

  return null;
}

function mapNotificationRow(row: NotificationRow): NotificationItem | null {
  const target = parseTarget(row.target);

  if (target === null) {
    process.stderr.write(
      `${JSON.stringify({ event: "notifications_unknown_target_screen", notificationId: row.id })}\n`,
    );
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    occurredAt: row.created_at,
    read: row.read_at !== null,
    target,
  };
}

export async function listNotifications(): Promise<ListNotificationsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, created_at, read_at, target")
    .order("created_at", { ascending: false })
    .limit(LIST_NOTIFICATIONS_LIMIT);

  if (error) {
    process.stderr.write(
      `${JSON.stringify({ event: "notifications_list_notifications_failed", code: error.code })}\n`,
    );
    return { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
  }

  const items = ((data ?? []) as NotificationRow[])
    .map(mapNotificationRow)
    .filter((item): item is NotificationItem => item !== null);

  const unreadCount = items.filter((item) => !item.read).length;

  return { ok: true, items, unreadCount };
}
