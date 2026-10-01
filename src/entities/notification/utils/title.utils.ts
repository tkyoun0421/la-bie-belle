import type {
  NotificationKind,
  NotificationPayload,
} from "@/entities/notification/model/types";

/**
 * 알림 한 줄이 무엇이라고 말하는지다. 정본은
 * `docs/2-design/modules/notification/screens/notifications.md`의 「알림 제목」 표고 이
 * 파일이 그 표를 옮긴다 — 문자열이 표와 글자 하나까지 같아야 한다.
 *
 * **한 알림의 문장이 한 곳에서만 난다.** 목록과 대시보드와 푸시가 같은 알림을 그리는데 셋이
 * 문장을 따로 들면 같은 것이 기기와 화면에서 다르게 읽힌다. 세 자리가 이 함수 하나를 쓴다.
 *
 * **1차 열여덟만 낸다.** 2차 다섯(교대 넷·관리자 공지)은 통째로 널이고 그 널이 「아직 문장이
 * 없다」로 읽힌다 — 유니온에는 스물셋이 다 있어 아래 표가 하나라도 빠지면 컴파일에서 걸린다
 * (`docs/2-design/modules/notification/design.md`의 「kind와 payload」).
 *
 * **아래 줄이 있는 종류가 넷이다** — 신청 접수 열림·미리 알림 둘·사유 거절. 목록은 제목만
 * 세우고 이 줄은 대시보드와 푸시가 쓴다.
 */

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

/** `"2025-10"`은 「10월」이다. 문장이 달을 말할 때는 연도를 안 붙인다. */
function spellMonth(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

/** `"2025-09-13"`은 「9월 13일」이다. 요일은 날짜 머리만 적는다. */
function spellDay(date: string): string {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
}

/** `"2025-09-13T09:00:00+09:00"`은 「09:00」이다. 시각은 24시간제다(writing.md). */
const KST_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

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
    sub: `${KST_CLOCK.format(new Date(text(payload, "start_at")))} · ${text(payload, "position")}`,
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
