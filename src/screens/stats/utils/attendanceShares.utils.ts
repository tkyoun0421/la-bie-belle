import type {
  MonthlyAttendanceTally,
  TalliedStatus,
} from "@/entities/attendance/model/attendance.type";
import { SHARE_LABELS } from "@/screens/stats/consts/stats.const";

export type AttendanceShare = {
  key: TalliedStatus;
  label: string;
  value: number;
};

export function attendanceRatioShares(
  tally: MonthlyAttendanceTally,
): AttendanceShare[] {
  return SHARE_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: tally[key],
  }));
}
