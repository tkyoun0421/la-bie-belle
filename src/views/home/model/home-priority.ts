import type { AttendanceStatus } from "@/entities/attendance/model/attendance-status";
import type { ScheduleConfirmation } from "@/entities/schedule/model/confirmation";

export type HomeViewModel =
  | {
      priority: "attendance";
      attendanceStatus: AttendanceStatus;
      shiftDate: string;
      position: string;
    }
  | { priority: "deadline-application"; date: string; applicationDeadline: string }
  | { priority: "confirmation-change"; confirmation: ScheduleConfirmation }
  | { priority: "next-shift"; date: string; position: string }
  | { priority: "empty" };

export type HomePriorityInput = {
  attendance: { status: AttendanceStatus; shiftDate: string; position: string } | null;
  deadlineApplication: { date: string; applicationDeadline: string } | null;
  confirmationChange: ScheduleConfirmation | null;
  nextShift: { date: string; position: string } | null;
};

export function deriveHomePriority(input: HomePriorityInput): HomeViewModel {
  if (input.attendance) {
    return {
      priority: "attendance",
      attendanceStatus: input.attendance.status,
      shiftDate: input.attendance.shiftDate,
      position: input.attendance.position,
    };
  }
  if (input.deadlineApplication) {
    return {
      priority: "deadline-application",
      date: input.deadlineApplication.date,
      applicationDeadline: input.deadlineApplication.applicationDeadline,
    };
  }
  if (input.confirmationChange) {
    return { priority: "confirmation-change", confirmation: input.confirmationChange };
  }
  if (input.nextShift) {
    return {
      priority: "next-shift",
      date: input.nextShift.date,
      position: input.nextShift.position,
    };
  }
  return { priority: "empty" };
}
