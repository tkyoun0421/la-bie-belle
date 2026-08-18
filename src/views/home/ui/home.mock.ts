import type {
  HomeViewModel,
  NoticeItem,
  PayRow,
  Shift,
  TodayShift,
  WeekDay,
} from "@/views/home/model/home-view-model";

export type HomeScenario = {
  model: HomeViewModel;
  now: Date;
  today: string;
  noticeIds: readonly string[];
};

const TODAY = "2026-08-18";

const NOTICES: readonly NoticeItem[] = [
  { id: "n1", kind: "vacancy", date: "2026-08-22" },
  { id: "n2", kind: "schedule-confirmed", month: "2026-08" },
  {
    id: "n3",
    kind: "assignment-changed",
    date: "2026-08-21",
    fromPosition: "홀서빙",
    toPosition: "접수",
  },
];

const NOTICE_IDS = NOTICES.map((notice) => notice.id);

function todayShift(attendanceWindow: TodayShift["attendanceWindow"]): TodayShift {
  return {
    date: TODAY,
    position: "홀서빙",
    startTime: "11:00",
    endTime: "16:00",
    headcount: 4,
    ceremonyTime: "14:00",
    attendanceWindow,
  };
}

const WEEK_DAYS: readonly WeekDay[] = [
  { date: "2026-08-17", hasShift: false },
  {
    date: "2026-08-18",
    hasShift: true,
    shift: { position: "홀서빙", hours: 5, amount: 100000 },
  },
  {
    date: "2026-08-19",
    hasShift: true,
    shift: { position: "접수", hours: 5, amount: 90000 },
  },
  { date: "2026-08-20", hasShift: false },
  { date: "2026-08-21", hasShift: false },
  {
    date: "2026-08-22",
    hasShift: true,
    shift: { position: "홀서빙", hours: 5, amount: 100000 },
  },
  { date: "2026-08-23", hasShift: false },
];

const WEEK_DAYS_EMPTY: readonly WeekDay[] = WEEK_DAYS.map((day) => ({
  date: day.date,
  hasShift: false,
}));

const UPCOMING_SHIFTS: readonly Shift[] = [
  { date: "2026-08-19", position: "접수", startTime: "10:00", endTime: "15:00" },
  { date: "2026-08-20", position: "홀서빙", startTime: "12:00", endTime: "17:00" },
  { date: "2026-08-22", position: "홀서빙", startTime: "10:00", endTime: "15:00" },
];

const PAY_ROWS: readonly PayRow[] = [
  { kind: "last-week", count: 2, hours: 11, amount: 132000 },
  { kind: "this-month", month: 8, count: 6, hours: 30, amount: 360000 },
  { kind: "year-to-date", year: 2026, count: 58, amount: 3744000 },
];

const PAY_ROWS_EMPTY: readonly PayRow[] = [
  { kind: "last-week", count: 0, hours: 0, amount: null },
  { kind: "this-month", month: 8, count: 0, hours: 0, amount: null },
  { kind: "year-to-date", year: 2026, count: 0, amount: null },
];

export const HOME_BASIC: HomeScenario = {
  today: TODAY,
  now: new Date("2026-08-18T09:41:01+09:00"),
  noticeIds: NOTICE_IDS,
  model: {
    notices: { state: "ready", data: NOTICES },
    today: {
      state: "ready",
      data: todayShift({ action: "check-in", scheduledAt: "2026-08-18T11:00:00+09:00" }),
    },
    week: { state: "ready", data: { days: WEEK_DAYS } },
    upcoming: { state: "ready", data: UPCOMING_SHIFTS },
    pay: { state: "ready", data: { rows: PAY_ROWS } },
  },
};

export const HOME_BEFORE_WINDOW: HomeScenario = {
  today: TODAY,
  now: new Date("2026-08-18T05:00:00+09:00"),
  noticeIds: NOTICE_IDS,
  model: {
    notices: { state: "ready", data: NOTICES },
    today: {
      state: "ready",
      data: todayShift({ action: "check-in", scheduledAt: "2026-08-18T11:00:00+09:00" }),
    },
    week: { state: "ready", data: { days: WEEK_DAYS } },
    upcoming: { state: "ready", data: UPCOMING_SHIFTS },
    pay: { state: "ready", data: { rows: PAY_ROWS } },
  },
};

export const HOME_WINDOW_OPEN: HomeScenario = {
  today: TODAY,
  now: new Date("2026-08-18T15:58:15+09:00"),
  noticeIds: NOTICE_IDS,
  model: {
    notices: { state: "ready", data: NOTICES },
    today: {
      state: "ready",
      data: todayShift({ action: "check-out", scheduledAt: "2026-08-18T16:00:00+09:00" }),
    },
    week: { state: "ready", data: { days: WEEK_DAYS } },
    upcoming: { state: "ready", data: UPCOMING_SHIFTS },
    pay: { state: "ready", data: { rows: PAY_ROWS } },
  },
};

export const HOME_OVERDUE: HomeScenario = {
  today: TODAY,
  now: new Date("2026-08-18T11:12:04+09:00"),
  noticeIds: NOTICE_IDS,
  model: {
    notices: { state: "ready", data: NOTICES },
    today: {
      state: "ready",
      data: todayShift({ action: "check-in", scheduledAt: "2026-08-18T11:00:00+09:00" }),
    },
    week: { state: "ready", data: { days: WEEK_DAYS } },
    upcoming: { state: "ready", data: UPCOMING_SHIFTS },
    pay: { state: "ready", data: { rows: PAY_ROWS } },
  },
};

export const HOME_NO_SHIFT_TODAY: HomeScenario = {
  today: TODAY,
  now: new Date("2026-08-18T09:00:00+09:00"),
  noticeIds: NOTICE_IDS,
  model: {
    notices: { state: "ready", data: NOTICES },
    today: { state: "ready", data: null },
    week: { state: "ready", data: { days: WEEK_DAYS } },
    upcoming: { state: "ready", data: UPCOMING_SHIFTS },
    pay: { state: "ready", data: { rows: PAY_ROWS } },
  },
};

export const HOME_ALL_EMPTY: HomeScenario = {
  today: TODAY,
  now: new Date("2026-08-18T09:00:00+09:00"),
  noticeIds: [],
  model: {
    notices: { state: "ready", data: [] },
    today: { state: "ready", data: null },
    week: { state: "ready", data: { days: WEEK_DAYS_EMPTY } },
    upcoming: { state: "ready", data: [] },
    pay: { state: "ready", data: { rows: PAY_ROWS_EMPTY } },
  },
};

export const HOME_LOADING: HomeScenario = {
  today: TODAY,
  now: new Date("2026-08-18T09:00:00+09:00"),
  noticeIds: [],
  model: {
    notices: { state: "loading" },
    today: { state: "loading" },
    week: { state: "loading" },
    upcoming: { state: "loading" },
    pay: { state: "loading" },
  },
};

export const HOME_PARTIAL_FAILURE: HomeScenario = {
  today: TODAY,
  now: new Date("2026-08-18T09:41:01+09:00"),
  noticeIds: NOTICE_IDS,
  model: {
    notices: { state: "ready", data: NOTICES },
    today: {
      state: "ready",
      data: todayShift({ action: "check-in", scheduledAt: "2026-08-18T11:00:00+09:00" }),
    },
    week: { state: "ready", data: { days: WEEK_DAYS } },
    upcoming: { state: "failed" },
    pay: { state: "failed" },
  },
};

export const HOME_ALL_FAILED: HomeScenario = {
  today: TODAY,
  now: new Date("2026-08-18T09:00:00+09:00"),
  noticeIds: [],
  model: {
    notices: { state: "failed" },
    today: { state: "failed" },
    week: { state: "failed" },
    upcoming: { state: "failed" },
    pay: { state: "failed" },
  },
};
