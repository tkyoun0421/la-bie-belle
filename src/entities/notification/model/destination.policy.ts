import type {
  NotificationKind,
  NotificationPayload,
} from "@/entities/notification/model/notification.type";

/**
 * 그 알림이 가리키는 자리다. 정본은
 * `docs/2-design/modules/notification/design.md`의 「UI 연결」 표고, 푸시를 누르든 대시보드의
 * CTA를 누르든 목록의 줄을 누르든 같은 곳이다.
 *
 * **날과 달이 갈린다.** 그날 하나를 보러 가는 알림은 `?date=`, 그달 전체가 바뀐 알림은
 * `?month=`다 — 근무가 빠진 사람은 그날 시트에 자기가 없어 그날로 보내면 볼 것이 없다.
 *
 * **관리자가 받는 알림은 관리자 층으로 바로 착지한다.** 근무 요청 수락·전부 소진과 빈 자리
 * 재촉이 그 자리고, 근무 취소 요청만 날이 아니라 승인할 일 목록이다.
 *
 * **1차 열여덟만 낸다.** 2차 다섯은 널이고 그 널이 「안 눌린다」로 읽힌다. 교대 넷을 지금
 * 채우지 않는 것은 「교대 수락 → 관리자」의 목적지가 아직 미정이라
 * (`docs/2-design/modules/swap/design.md`의 「아직 안 정한 것」) 그 미정이 코드로 새지 않게
 * 하려는 것이다.
 */

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
