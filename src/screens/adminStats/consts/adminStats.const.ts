export const ADMIN_STATS_TABS = ["work", "attendance"] as const;

export const TAB_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "work", label: "근무" },
  { value: "attendance", label: "근태" },
];

export const ADMIN_STATS_COPY = {
  appBarTitle: "통계",
  emptyTitle: "이 달은 아직 근무표가 없어요",
  emptyBody: "근무를 넣으면 여기 숫자가 서요",
  readFailed: "통계를 불러오지 못했어요",
  retry: "다시 시도",
} as const;

export const SKELETON_ROWS = [0, 1, 2];

export const MONTH_LENGTH = 7;
