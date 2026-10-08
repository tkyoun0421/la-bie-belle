import type {
  NotificationKind,
  NotificationPayload,
} from "@/entities/notification/model/notification.type";

type Point = (payload: NotificationPayload) => string;

function text(payload: NotificationPayload, key: string): string {
  const value = payload[key];

  return typeof value === "string" ? value : "";
}

function workerDay(payload: NotificationPayload): string {
  return `/schedule?date=${text(payload, "work_date")}`;
}

function workerMonth(payload: NotificationPayload): string {
  return `/schedule?month=${text(payload, "month")}`;
}

function adminDay(payload: NotificationPayload): string {
  return `/admin/schedule?date=${text(payload, "work_date")}`;
}

const POINT_OF: Record<NotificationKind, Point | null> = {
  signup_approved: () => "/",
  requests_open: workerMonth,
  deadline_changed: workerMonth,
  schedule_confirmed: workerMonth,
  assignment_added: workerDay,
  assignment_removed: workerMonth,
  shift_reminder: workerDay,
  weekend_reminder: workerDay,
  before_shift: () => "/check-in",
  work_requested: workerDay,
  work_request_accepted: adminDay,
  work_request_exhausted: adminDay,
  cancel_requested: () => "/admin/approvals",
  cancel_approved: workerMonth,
  cancel_rejected: workerDay,
  excuse_approved: workerDay,
  excuse_rejected: workerDay,
  vacancy_nudge: adminDay,

  admin_notice: null,
  swap_requested: null,
  swap_accepted: null,
  swap_approved: null,
  swap_exhausted: null,
};

export type NotificationDestinationInput = {
  kind: string;
  payload: NotificationPayload;
};

export function toNotificationDestination(
  row: NotificationDestinationInput,
): string | null {
  const point: Point | null | undefined =
    POINT_OF[row.kind as NotificationKind];

  return point == null ? null : point(row.payload);
}
