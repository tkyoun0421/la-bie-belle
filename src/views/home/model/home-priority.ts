import type { AttendanceAction } from "@/entities/attendance/model/attendance-status";

export type HomePriorityInput = {
  attendanceAction: AttendanceAction | null;
  deadlineSoonApplication: boolean;
  unacknowledgedChange: boolean;
  nextShiftDate: string | null;
};

export type HomePriority =
  | { type: "attendance"; action: AttendanceAction }
  | { type: "deadline-application" }
  | { type: "confirmation-change" }
  | { type: "next-shift"; date: string }
  | { type: "empty" };

export function deriveHomePriority(input: HomePriorityInput): HomePriority {
  if (input.attendanceAction) {
    return { type: "attendance", action: input.attendanceAction };
  }
  if (input.deadlineSoonApplication) {
    return { type: "deadline-application" };
  }
  if (input.unacknowledgedChange) {
    return { type: "confirmation-change" };
  }
  if (input.nextShiftDate) {
    return { type: "next-shift", date: input.nextShiftDate };
  }
  return { type: "empty" };
}
