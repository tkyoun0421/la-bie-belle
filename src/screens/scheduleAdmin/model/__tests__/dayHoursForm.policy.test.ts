// 구현 대상: src/screens/scheduleAdmin/model/dayHoursForm.policy.ts
//
// 근무 시간 시트의 저장 버튼 활성 판정이다. 끝이 시작보다 이르면 화면이 먼저 막고
// 서버까지 가면 `bad_hours`다(plan AC-05, schedule-admin.md AC-05).

import { isDayHoursSaveEnabled } from "@/screens/scheduleAdmin/model/dayHoursForm.policy";

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
