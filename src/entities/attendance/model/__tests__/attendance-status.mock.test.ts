import { describe, expect, it } from "vitest";

import {
  ATTENDANCE_CHECKING,
  ATTENDANCE_FAILURE_LOW_ACCURACY,
  ATTENDANCE_FAILURE_OUT_OF_RANGE,
  ATTENDANCE_FAILURE_PERMISSION_DENIED,
  ATTENDANCE_READY_CHECK_IN,
  ATTENDANCE_READY_CHECK_OUT,
  ATTENDANCE_SUCCESS,
} from "@/entities/attendance/model/attendance-status.mock";

describe("attendance-status mock", () => {
  it("출근·퇴근 가능 상태를 각각 제공한다", () => {
    expect(ATTENDANCE_READY_CHECK_IN.action).toBe("check-in");
    expect(ATTENDANCE_READY_CHECK_OUT.action).toBe("check-out");
  });

  it("GPS 확인 중·성공 상태를 제공한다", () => {
    expect(ATTENDANCE_CHECKING.type).toBe("checking");
    expect(ATTENDANCE_SUCCESS.type).toBe("success");
  });

  it("GPS 실패 3종을 모두 제공한다", () => {
    const failures = [
      ATTENDANCE_FAILURE_PERMISSION_DENIED,
      ATTENDANCE_FAILURE_LOW_ACCURACY,
      ATTENDANCE_FAILURE_OUT_OF_RANGE,
    ];

    expect(failures.map((state) => (state.type === "failure" ? state.reason : null))).toEqual([
      "permission-denied",
      "low-accuracy",
      "out-of-range",
    ]);
  });
});
