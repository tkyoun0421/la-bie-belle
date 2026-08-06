import type { AttendanceStatus } from "@/entities/attendance/model/attendance-status";

export const ATTENDANCE_READY_CHECK_IN: AttendanceStatus = {
  type: "ready",
  action: "check-in",
};

export const ATTENDANCE_READY_CHECK_OUT: AttendanceStatus = {
  type: "ready",
  action: "check-out",
};

export const ATTENDANCE_CHECKING: AttendanceStatus = {
  type: "checking",
  action: "check-in",
};

export const ATTENDANCE_SUCCESS: AttendanceStatus = {
  type: "success",
  action: "check-in",
  confirmedAt: "2026-08-09T08:58:03+09:00",
};

export const ATTENDANCE_FAILURE_PERMISSION_DENIED: AttendanceStatus = {
  type: "failure",
  action: "check-in",
  reason: "permission-denied",
};

export const ATTENDANCE_FAILURE_LOW_ACCURACY: AttendanceStatus = {
  type: "failure",
  action: "check-in",
  reason: "low-accuracy",
};

export const ATTENDANCE_FAILURE_OUT_OF_RANGE: AttendanceStatus = {
  type: "failure",
  action: "check-in",
  reason: "out-of-range",
};
