import type {
  AttendanceStatus,
  AttendanceStatusInput,
} from "@/entities/attendance/model/attendance.type";
import type { AttendanceSummary } from "@/entities/attendance/model/attendance.type";
import { checkInWindowOpensAt } from "@/entities/attendance/model/attendanceStatus.policy";

export function isAttendanceColumnVisible(
  input: AttendanceStatusInput,
): boolean {
  return Date.parse(input.now) >= checkInWindowOpensAt(input);
}

const REST_LABELS: [AttendanceStatus, string][] = [
  ["late", "지각"],
  ["unmarked", "아직"],
  ["pending", "확인 중"],
  ["excused", "출근 인정"],
  ["absent", "결근"],
];

export function dayAttendanceLine(
  summary: AttendanceSummary,
  total: number,
): string {
  const present = summary.present ?? 0;
  const rest = REST_LABELS.filter(([status]) => (summary[status] ?? 0) > 0).map(
    ([status, label]) => `${label} ${summary[status]}`,
  );

  if (rest.length === 0 && present === total) {
    return `${total}명 전원 출근`;
  }

  return [`${total}명 중 ${present}명 출근`, ...rest].join(" · ");
}
