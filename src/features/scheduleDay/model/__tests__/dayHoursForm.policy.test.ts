import { isDayHoursSaveEnabled } from "@/features/scheduleDay/model/dayHoursForm.policy";

describe("isDayHoursSaveEnabled — 끝이 시작보다 늦으면 저장할 수 있다", () => {
  it("10:00~19:00이면 true다", () => {
    expect(isDayHoursSaveEnabled({ starts: "10:00", ends: "19:00" })).toBe(
      true,
    );
  });
});

describe("isDayHoursSaveEnabled — 끝이 시작과 같거나 이르면 저장을 막는다", () => {
  it("끝과 시작이 같으면 false다", () => {
    expect(isDayHoursSaveEnabled({ starts: "10:00", ends: "10:00" })).toBe(
      false,
    );
  });

  it("끝이 시작보다 이르면 false다", () => {
    expect(isDayHoursSaveEnabled({ starts: "22:00", ends: "10:00" })).toBe(
      false,
    );
  });
});
