import { kstDateOf } from "@/shared/utils/kstDate";
import { ADMIN_NOTICE } from "@/entities/notification/consts/notification.const";

export type NotificationDateGroup<Row> = {
  date: string;
  rows: Row[];
};

export function groupNotificationsByDate<Row extends { created_at: string }>(
  rows: readonly Row[],
): NotificationDateGroup<Row>[] {
  const groups: NotificationDateGroup<Row>[] = [];

  for (const row of rows) {
    const date = kstDateOf(row.created_at);
    const last = groups.at(-1);

    if (last !== undefined && last.date === date) {
      last.rows.push(row);
      continue;
    }

    groups.push({ date, rows: [row] });
  }

  return groups;
}

export type NotificationsListState =
  | "loading"
  | "error"
  | "empty"
  | "loadingMore"
  | "errorMore"
  | "end"
  | "normal";

export type NotificationsListInput = {
  rows: readonly unknown[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isFetchNextPageError: boolean;
};

export function resolveNotificationsListState(
  input: NotificationsListInput,
): NotificationsListState {
  if (input.isLoading) {
    return "loading";
  }

  if (input.isError) {
    return "error";
  }

  if (input.rows.length === 0) {
    return "empty";
  }

  if (input.isFetchingNextPage) {
    return "loadingMore";
  }

  if (input.isFetchNextPageError) {
    return "errorMore";
  }

  return input.hasNextPage ? "normal" : "end";
}

export function unreadAdminNoticeIds<
  Row extends { id: string; kind: string; read_at: string | null },
>(rows: readonly Row[]): string[] {
  return rows
    .filter((row) => row.kind === ADMIN_NOTICE && row.read_at === null)
    .map((row) => row.id);
}
