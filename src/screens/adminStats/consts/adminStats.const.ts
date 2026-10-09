import type { TalliedStatus } from "@/entities/attendance/model/attendance.type";

export const ADMIN_STATS_TABS = ["work", "attendance"] as const;

export const TAB_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "work", label: "근무" },
  { value: "attendance", label: "근태" },
];

export const SHARE_LABELS: readonly { key: TalliedStatus; label: string }[] = [
  { key: "present", label: "출근" },
  { key: "excused", label: "인정" },
  { key: "late", label: "지각" },
  { key: "absent", label: "결근" },
];

export const ADMIN_STATS_COPY = {
  appBarTitle: "통계",
  emptyTitle: "이 달은 아직 근무표가 없어요",
  emptyBody: "근무를 넣으면 여기 숫자가 서요",
  readFailed: "통계를 불러오지 못했어요",
  retry: "다시 시도",
  peopleSection: "사람별",
  positionSection: "포지션",
  workCountPrefix: "근무 ",
  workCountSuffix: "건",
  countSuffix: "건",
  timesSuffix: "회",
  totalPrefix: "합계 · ",
} as const;

export const SKELETON_ROWS = [0, 1, 2];

export const AVATAR_SIZE = 40;

export const MONTH_LENGTH = 7;
