import type {
  AttendanceStatus,
  TalliedStatus,
} from "@/entities/attendance/model/attendance.type";

export const TREND_MONTHS = 12;

export const AVATAR_SIZE = 40;

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "출근",
  late: "지각",
  unmarked: "안 찍음",
  pending: "확인 중",
  excused: "인정",
  absent: "결근",
};

export const SHARE_LABELS: readonly { key: TalliedStatus; label: string }[] = [
  { key: "present", label: "출근" },
  { key: "excused", label: "인정" },
  { key: "late", label: "지각" },
  { key: "absent", label: "결근" },
];

export const STATS_COPY = {
  countSuffix: "건",
  timesSuffix: "회",
  peopleSection: "사람별",
  positionSection: "포지션",
  workCountPrefix: "근무 ",
  workCountSuffix: "건",
  totalPrefix: "합계 · ",
} as const;
