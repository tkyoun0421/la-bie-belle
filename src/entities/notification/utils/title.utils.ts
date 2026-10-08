import type {
  NotificationKind,
  NotificationPayload,
} from "@/entities/notification/model/notification.type";
import { spellKstClock } from "@/entities/notification/utils/kstClock.utils";

export type NotificationTitle = {
  title: string;
  sub: string | null;
};

type Compose = (payload: NotificationPayload) => NotificationTitle;

function text(payload: NotificationPayload, key: string): string {
  const value = payload[key];

  return typeof value === "string" ? value : "";
}

function count(payload: NotificationPayload, key: string): number {
  const value = payload[key];

  return typeof value === "number" ? value : 0;
}

function dates(payload: NotificationPayload, key: string): string[] {
  const value = payload[key];

  return Array.isArray(value)
    ? value.filter((one): one is string => typeof one === "string")
    : [];
}

function spellMonth(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

function spellDay(date: string): string {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
}

function only(title: string): NotificationTitle {
  return { title, sub: null };
}

const COMPOSE_OF: Record<NotificationKind, Compose | null> = {
  signup_approved: () => only("가입이 승인됐어요"),

  requests_open: (payload) => ({
    title: `${spellMonth(text(payload, "month"))} 근무 신청을 받아요`,
    sub: `${spellDay(text(payload, "deadline"))}까지`,
  }),

  deadline_changed: (payload) =>
    only(
      `${spellMonth(text(payload, "month"))} 근무 신청 마감이 ${spellDay(text(payload, "deadline"))}로 바뀌었어요`,
    ),

  schedule_confirmed: (payload) =>
    only(`${spellMonth(text(payload, "month"))} 근무표가 확정됐어요`),

  assignment_added: (payload) =>
    only(`${spellDay(text(payload, "work_date"))} 근무가 생겼어요`),

  assignment_removed: (payload) =>
    only(`${spellDay(text(payload, "work_date"))} 근무가 빠졌어요`),

  shift_reminder: (payload) => ({
    title: "내일 근무가 있어요",
    sub: `${spellKstClock(text(payload, "start_at"))} · ${text(payload, "position")}`,
  }),

  weekend_reminder: (payload) => ({
    title: "이번 주말 근무가 이틀 있어요",
    sub: dates(payload, "dates").map(spellDay).join(" · "),
  }),

  before_shift: () => only("10분 뒤에 근무가 시작돼요"),

  work_requested: (payload) =>
    only(`${spellDay(text(payload, "work_date"))} 근무를 해줄 수 있나요?`),

  work_request_accepted: (payload) =>
    only(
      `${text(payload, "actor_name")} 님이 ${spellDay(text(payload, "work_date"))} 근무를 맡았어요`,
    ),

  work_request_exhausted: (payload) =>
    only(
      `${spellDay(text(payload, "work_date"))} ${text(payload, "position")} 자리를 아무도 못 맡았어요`,
    ),

  cancel_requested: (payload) =>
    only(
      `${text(payload, "actor_name")} 님이 ${spellDay(text(payload, "work_date"))} 근무를 못 하겠다고 해요`,
    ),

  cancel_approved: (payload) =>
    only(`${spellDay(text(payload, "work_date"))} 근무가 취소됐어요`),

  cancel_rejected: (payload) =>
    only(`${spellDay(text(payload, "work_date"))} 근무 취소가 거절됐어요`),

  excuse_approved: (payload) =>
    only(`${spellDay(text(payload, "work_date"))} 출근이 인정됐어요`),

  excuse_rejected: (payload) => ({
    title: `${spellDay(text(payload, "work_date"))} 사유가 인정되지 않았어요`,
    sub: text(payload, "reason"),
  }),

  vacancy_nudge: (payload) =>
    only(
      `${spellDay(text(payload, "work_date"))}에 빈 자리가 ${count(payload, "count")}개 남았어요`,
    ),

  admin_notice: null,
  swap_requested: null,
  swap_accepted: null,
  swap_approved: null,
  swap_exhausted: null,
};

export type NotificationTitleInput = {
  kind: string;
  payload: NotificationPayload;
};

export function toNotificationTitle(
  row: NotificationTitleInput,
): NotificationTitle | null {
  const compose: Compose | null | undefined =
    COMPOSE_OF[row.kind as NotificationKind];

  return compose == null ? null : compose(row.payload);
}
