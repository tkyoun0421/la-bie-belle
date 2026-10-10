import { absenceMinutes } from "@/features/payrollCompute/utils/absenceMinutes.utils";

describe("absenceMinutes — 그날 배정 시간만큼의 음수다", () => {
  it("9시간 배정이면 -540분이다", () => {
    expect(absenceMinutes({ startsAt: "10:00", endsAt: "19:00" })).toBe(-540);
  });

  it("8시간 배정이면 -480분이다", () => {
    expect(absenceMinutes({ startsAt: "10:00", endsAt: "18:00" })).toBe(-480);
  });

  it("10시간 배정이면 -600분이다", () => {
    expect(absenceMinutes({ startsAt: "09:00", endsAt: "19:00" })).toBe(-600);
  });
});
