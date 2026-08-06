import {
  ATTENDANCE_CHECKING,
  ATTENDANCE_FAILURE_LOW_ACCURACY,
  ATTENDANCE_FAILURE_OUT_OF_RANGE,
  ATTENDANCE_FAILURE_PERMISSION_DENIED,
  ATTENDANCE_READY_CHECK_IN,
  ATTENDANCE_READY_CHECK_OUT,
  ATTENDANCE_SUCCESS,
} from "@/entities/attendance/model/attendance-status.mock";
import { CONFIRMED_WITH_CHANGE } from "@/entities/schedule/model/confirmation.mock";
import type { HomeViewModel } from "@/views/home/ui/HomeView";

export const HOME_CHECK_IN_AVAILABLE: HomeViewModel = {
  priority: "attendance",
  attendanceStatus: ATTENDANCE_READY_CHECK_IN,
  shiftDate: "2026-08-09",
  position: "플로어",
};

export const HOME_CHECK_OUT_AVAILABLE: HomeViewModel = {
  priority: "attendance",
  attendanceStatus: ATTENDANCE_READY_CHECK_OUT,
  shiftDate: "2026-08-09",
  position: "플로어",
};

export const HOME_ATTENDANCE_CHECKING: HomeViewModel = {
  priority: "attendance",
  attendanceStatus: ATTENDANCE_CHECKING,
  shiftDate: "2026-08-09",
  position: "플로어",
};

export const HOME_ATTENDANCE_SUCCESS: HomeViewModel = {
  priority: "attendance",
  attendanceStatus: ATTENDANCE_SUCCESS,
  shiftDate: "2026-08-09",
  position: "플로어",
};

export const HOME_ATTENDANCE_FAILURE_PERMISSION_DENIED: HomeViewModel = {
  priority: "attendance",
  attendanceStatus: ATTENDANCE_FAILURE_PERMISSION_DENIED,
  shiftDate: "2026-08-09",
  position: "플로어",
};

export const HOME_ATTENDANCE_FAILURE_LOW_ACCURACY: HomeViewModel = {
  priority: "attendance",
  attendanceStatus: ATTENDANCE_FAILURE_LOW_ACCURACY,
  shiftDate: "2026-08-09",
  position: "플로어",
};

export const HOME_ATTENDANCE_FAILURE_OUT_OF_RANGE: HomeViewModel = {
  priority: "attendance",
  attendanceStatus: ATTENDANCE_FAILURE_OUT_OF_RANGE,
  shiftDate: "2026-08-09",
  position: "플로어",
};

export const HOME_DEADLINE_APPLICATION: HomeViewModel = {
  priority: "deadline-application",
  date: "2026-08-09",
  applicationDeadline: "2026-08-07",
};

export const HOME_CONFIRMATION_CHANGE: HomeViewModel = {
  priority: "confirmation-change",
  confirmation: CONFIRMED_WITH_CHANGE,
};

export const HOME_NEXT_SHIFT: HomeViewModel = {
  priority: "next-shift",
  date: "2026-08-23",
  position: "플로어",
};

export const HOME_EMPTY: HomeViewModel = { priority: "empty" };
