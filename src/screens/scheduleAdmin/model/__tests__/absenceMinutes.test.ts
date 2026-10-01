// 구현 대상: src/screens/scheduleAdmin/model/absenceMinutes.ts
//
// 결근을 고른 순간 화면이 계산해 넣는 음수다 — 그날 배정 시간만큼이다
// (payroll-adjust plan 「결근 음수는 고른 순간의 배정 시간이다」). 시:분 파싱을 새로
// 짜지 않고 `@/features/payroll/model/dayMinutes`의 `dayMinutes`를 재사용해야
// 두 화면(급여 화면과 이 시트)이 같은 시간을 말한다.

import { absenceMinutes } from "@/screens/scheduleAdmin/model/absenceMinutes";

describe("absenceMinutes — 그날 배정 시간만큼의 음수다", () => {
  it("9시간 배정이면 -540분이다", () => {
    expect(absenceMinutes({ starts_at: "10:00", ends_at: "19:00" })).toBe(-540);
  });

  it("8시간 배정이면 -480분이다", () => {
    expect(absenceMinutes({ starts_at: "10:00", ends_at: "18:00" })).toBe(-480);
  });

  it("10시간 배정이면 -600분이다", () => {
    expect(absenceMinutes({ starts_at: "09:00", ends_at: "19:00" })).toBe(-600);
  });
});
