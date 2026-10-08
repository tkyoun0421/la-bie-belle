import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendance.type";

export type AttendanceRow = {
  profileId: string;
  displayName: string;
  present: number;
  late: number | null;
  absent: number | null;
  excused: number | null;
};

export type AttendanceTab = {
  tally: MonthlyAttendanceTally;
  rows: AttendanceRow[];
};
