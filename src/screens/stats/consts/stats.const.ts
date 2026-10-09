export const MONTH_LENGTH = 7;

export const SKELETON_ROWS = [0, 1, 2] as const;

export const STATS_TABS = ["attendance", "position", "payroll"] as const;

export const TAB_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "attendance", label: "근태" },
  { value: "position", label: "포지션" },
  { value: "payroll", label: "급여" },
];

export const STATS_COPY = {
  appBarTitle: "통계",
  emptyTitle: "이 달은 근무가 없어요",
  emptyBody: "근무가 잡히면 여기 숫자가 서요",
  readFailed: "통계를 불러오지 못했어요",
  retry: "다시 시도",
  countSuffix: "건",
} as const;
