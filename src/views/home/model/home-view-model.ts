export const HOME_BLOCK_NAMES = ["notices", "today", "week", "upcoming", "pay"] as const;

export type HomeBlockName = (typeof HOME_BLOCK_NAMES)[number];

export type AttendanceAction = "check-in" | "check-out";

export type AttendanceWindow = {
  action: AttendanceAction;
  scheduledAt: string;
};

export type Shift = {
  date: string;
  position: string;
  startTime: string;
  endTime: string;
};

export type WeekDayShift = {
  position: string;
  hours: number;
  amount: number;
};

export type WeekDay = {
  date: string;
  hasShift: boolean;
  shift?: WeekDayShift | null;
};

export type NoticeKind =
  "schedule-confirmed" | "vacancy" | "assignment-changed" | "change-approved" | "change-rejected";

export type VacancyNotice = {
  id: string;
  kind: "vacancy";
  date: string;
};

export type ScheduleConfirmedNotice = {
  id: string;
  kind: "schedule-confirmed";
  month: string;
};

export type AssignmentChangedNotice = {
  id: string;
  kind: "assignment-changed";
  date: string;
  fromPosition: string;
  toPosition: string;
};

export type ChangeApprovedNotice = {
  id: string;
  kind: "change-approved";
  date: string;
};

export type ChangeRejectedNotice = {
  id: string;
  kind: "change-rejected";
  date: string;
};

export type NoticeItem =
  | VacancyNotice
  | ScheduleConfirmedNotice
  | AssignmentChangedNotice
  | ChangeApprovedNotice
  | ChangeRejectedNotice;

export type TodayShift = {
  date: string;
  position: string;
  startTime: string;
  endTime: string;
  headcount: number;
  ceremonyTime: string;
  attendanceWindow: AttendanceWindow;
};

export type PayRowContent =
  | { kind: "last-week"; count: number; hours: number }
  | { kind: "this-month"; month: number; count: number; hours: number }
  | { kind: "year-to-date"; year: number; count: number };

export type PayRow = PayRowContent & { amount: number | null };

export type HomeBlockState<TData> =
  { state: "ready"; data: TData } | { state: "loading" } | { state: "failed" };

export type HomeViewModel = {
  notices: HomeBlockState<readonly NoticeItem[]>;
  today: HomeBlockState<TodayShift | null>;
  week: HomeBlockState<{ days: readonly WeekDay[] }>;
  upcoming: HomeBlockState<readonly Shift[]>;
  pay: HomeBlockState<{ rows: readonly PayRow[] }>;
};
