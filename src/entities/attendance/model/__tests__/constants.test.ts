import {
  CHECKED_AT_DEVICE_TOLERANCE_MINUTES,
  LATE_THRESHOLD_MINUTES,
} from "@/entities/attendance/model/constants";

describe("attendance 업무 상수 — 지각 유예와 checked_at 기기 오차 한도는 이름이 다른 상수다", () => {
  it("지각 유예는 10분이다(ATT-016)", () => {
    expect(LATE_THRESHOLD_MINUTES).toBe(10);
  });

  it("checked_at 기기 오차 한도는 10분이다(AC-03) — 지각 유예와 값은 같지만 이름이 다른 상수다", () => {
    expect(CHECKED_AT_DEVICE_TOLERANCE_MINUTES).toBe(10);
  });
});
