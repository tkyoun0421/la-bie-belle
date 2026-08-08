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
import { deriveHomePriority } from "@/views/home/model/home-priority";

const NO_FACTS = {
  attendance: null,
  deadlineApplication: null,
  confirmationChange: null,
  nextShift: null,
} as const;

export const HOME_CHECK_IN_AVAILABLE = deriveHomePriority({
  ...NO_FACTS,
  attendance: { status: ATTENDANCE_READY_CHECK_IN, shiftDate: "2026-08-09", position: "플로어" },
});

export const HOME_CHECK_OUT_AVAILABLE = deriveHomePriority({
  ...NO_FACTS,
  attendance: { status: ATTENDANCE_READY_CHECK_OUT, shiftDate: "2026-08-09", position: "플로어" },
});

export const HOME_ATTENDANCE_CHECKING = deriveHomePriority({
  ...NO_FACTS,
  attendance: { status: ATTENDANCE_CHECKING, shiftDate: "2026-08-09", position: "플로어" },
});

export const HOME_ATTENDANCE_SUCCESS = deriveHomePriority({
  ...NO_FACTS,
  attendance: { status: ATTENDANCE_SUCCESS, shiftDate: "2026-08-09", position: "플로어" },
});

export const HOME_ATTENDANCE_FAILURE_PERMISSION_DENIED = deriveHomePriority({
  ...NO_FACTS,
  attendance: {
    status: ATTENDANCE_FAILURE_PERMISSION_DENIED,
    shiftDate: "2026-08-09",
    position: "플로어",
  },
});

export const HOME_ATTENDANCE_FAILURE_LOW_ACCURACY = deriveHomePriority({
  ...NO_FACTS,
  attendance: {
    status: ATTENDANCE_FAILURE_LOW_ACCURACY,
    shiftDate: "2026-08-09",
    position: "플로어",
  },
});

export const HOME_ATTENDANCE_FAILURE_OUT_OF_RANGE = deriveHomePriority({
  ...NO_FACTS,
  attendance: {
    status: ATTENDANCE_FAILURE_OUT_OF_RANGE,
    shiftDate: "2026-08-09",
    position: "플로어",
  },
});

export const HOME_DEADLINE_APPLICATION = deriveHomePriority({
  ...NO_FACTS,
  deadlineApplication: { date: "2026-08-09", applicationDeadline: "2026-08-07", applied: false },
});

export const HOME_DEADLINE_APPLICATION_APPLIED = deriveHomePriority({
  ...NO_FACTS,
  deadlineApplication: { date: "2026-08-09", applicationDeadline: "2026-08-07", applied: true },
});

export const HOME_CONFIRMATION_CHANGE = deriveHomePriority({
  ...NO_FACTS,
  confirmationChange: CONFIRMED_WITH_CHANGE,
});

export const HOME_NEXT_SHIFT = deriveHomePriority({
  ...NO_FACTS,
  nextShift: { date: "2026-08-23", position: "플로어" },
});

export const HOME_EMPTY = deriveHomePriority(NO_FACTS);
