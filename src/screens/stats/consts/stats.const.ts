import type { AttendanceStatus } from "@/entities/attendance/model/attendance.type";
import type { TalliedStatus } from "@/entities/attendance/model/attendance.type";
import type { PayrollDayKind } from "@/entities/payroll/model/payroll.type";

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

export const MONTH_LENGTH = 7;

export const ABSENT: PayrollDayKind = "absent";

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
  historyRow: "내역 보기",
  readFailed: "통계를 불러오지 못했어요",
  retry: "다시 시도",
  estimateNote: "예상치예요. 실제 지급액과 다를 수 있어요",
  countSuffix: "건",
} as const;
