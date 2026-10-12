import { kstDateOf } from "@/shared/utils/kstDate";
import { ADMIN_NOTICE } from "@/entities/notification/consts/notification.const";
import type { Notification } from "@/entities/notification/model/notification.type";

export type NotificationDateGroup<Row> = {
  date: string;
  rows: Row[];
};

export function groupNotificationsByDate<
  Row extends Pick<Notification, "createdAt">,
>(rows: readonly Row[]): NotificationDateGroup<Row>[] {
  const groups: NotificationDateGroup<Row>[] = [];

  for (const row of rows) {
    const date = kstDateOf(row.createdAt);
    const last = groups.at(-1);

    if (last !== undefined && last.date === date) {
      last.rows.push(row);
      continue;
    }

    groups.push({ date, rows: [row] });
  }

  return groups;
}

export type NotificationsPaging = "idle" | "pending" | "failed" | "end";

export type NotificationsPagingInput = {
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  hasNextPage: boolean;
};

export function resolveNotificationsPaging(
  input: NotificationsPagingInput,
): NotificationsPaging {
  if (input.isFetchingNextPage) {
    return "pending";
  }

  if (input.isFetchNextPageError) {
    return "failed";
  }

  return input.hasNextPage ? "idle" : "end";
}

export function unreadAdminNoticeIds<
  Row extends Pick<Notification, "id" | "kind" | "readAt">,
>(rows: readonly Row[]): string[] {
  return rows
    .filter((row) => row.kind === ADMIN_NOTICE && row.readAt === null)
    .map((row) => row.id);
}
