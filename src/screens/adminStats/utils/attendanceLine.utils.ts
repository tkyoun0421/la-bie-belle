import type {
  MonthlyAttendanceTally,
  TalliedStatus,
} from "@/entities/attendance/model/attendance.type";
import { SHARE_LABELS } from "@/screens/adminStats/consts/adminStats.const";

export type AdminAttendanceShare = {
  key: TalliedStatus;
  label: string;
  value: number;
};

export function adminAttendanceLine(tally: MonthlyAttendanceTally): string {
  return [
    `출근 ${tally.present}`,
    `지각 ${tally.late}`,
    `출근 인정 ${tally.excused}`,
    `결근 ${tally.absent}`,
  ].join(" · ");
}

export function adminAttendanceShares(
  tally: MonthlyAttendanceTally,
): AdminAttendanceShare[] {
  return SHARE_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: tally[key],
  }));
}
