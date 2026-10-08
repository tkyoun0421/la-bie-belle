import type { DB } from "@/shared/api/database";
import type { NotificationRow } from "@/entities/notification/api/notification.dto";
import { NOTIFICATION_PAGE_SIZE } from "@/entities/notification/consts/notification.const";
import type { Notification } from "@/entities/notification/model/notification.type";
import { toNotification } from "@/entities/notification/utils/notification.mapper";

export const NOTIFICATION_COLUMNS =
  "id, profile_id, kind, payload, subject_id, created_at, read_at, claimed_at, push_attempts, pushed_at";

export async function getNotifications(
  client: DB,
  page: number,
): Promise<Notification[]> {
  const first = page * NOTIFICATION_PAGE_SIZE;
  const { data, error } = await client
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false })
    .range(first, first + NOTIFICATION_PAGE_SIZE - 1)
    .returns<NotificationRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(toNotification);
}
