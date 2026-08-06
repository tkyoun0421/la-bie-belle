export type AttendanceAction = "check-in" | "check-out";

export type AttendanceFailureReason = "permission-denied" | "low-accuracy" | "out-of-range";

export type AttendanceStatus =
  | { type: "ready"; action: AttendanceAction }
  | { type: "checking"; action: AttendanceAction }
  | { type: "success"; action: AttendanceAction; confirmedAt: string }
  | { type: "failure"; action: AttendanceAction; reason: AttendanceFailureReason };
