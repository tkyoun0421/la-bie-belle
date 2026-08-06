import { describe, expect, it } from "vitest";

import type { AttendanceStatus } from "@/entities/attendance/model/attendance-status";

describe("AttendanceStatus", () => {
  it("확인 중·성공·실패 상태를 구분하는 discriminated union이다", () => {
    const checking: AttendanceStatus = { type: "checking", action: "check-in" };
    const success: AttendanceStatus = {
      type: "success",
      action: "check-in",
      confirmedAt: "2026-08-09T08:58:03+09:00",
    };
    const failure: AttendanceStatus = {
      type: "failure",
      action: "check-in",
      reason: "permission-denied",
    };

    expect([checking.type, success.type, failure.type]).toEqual(["checking", "success", "failure"]);
  });

  it("실패 사유는 권한 꺼짐·정확도 낮음·범위 밖 3종이다", () => {
    const reasons: Array<Extract<AttendanceStatus, { type: "failure" }>["reason"]> = [
      "permission-denied",
      "low-accuracy",
      "out-of-range",
    ];

    expect(reasons).toHaveLength(3);
  });
});
