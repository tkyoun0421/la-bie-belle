// 구현 대상: src/screens/rehearsal/model/rehearsalDayCell.policy.ts
//
// 달력 칸의 바닥 단이다(rehearsal.md 「달력 칸」) — 리허설이 없는 날은 단이 비고, 있는 날은
// 배경이 bg.neutral-weak로 깔리며 「2시간」이 선다. 바닥 단이 건수가 아니라 시간인 것이
// 이 화면이 근무표 달력과 가장 다른 자리다.

import { rehearsalDayCell } from "@/screens/rehearsal/model/rehearsalDayCell.policy";

describe("rehearsalDayCell — 시간이 0분이면 빈 칸이다", () => {
  it("0분이면 상태가 empty고 라벨이 빈 문자열이다", () => {
    expect(rehearsalDayCell(0)).toEqual({ state: "empty", label: "" });
  });
});

describe("rehearsalDayCell — 시간이 있으면 has 상태로 「N시간」을 적는다", () => {
  it("120분이면 has 상태에 「2시간」이다", () => {
    expect(rehearsalDayCell(120)).toEqual({ state: "has", label: "2시간" });
  });

  it("60분이면 has 상태에 「1시간」이다", () => {
    expect(rehearsalDayCell(60)).toEqual({ state: "has", label: "1시간" });
  });
});

describe("rehearsalDayCell — 60분 배수가 아니면 분까지 적는다", () => {
  it("90분이면 「1시간 30분」이다", () => {
    expect(rehearsalDayCell(90)).toEqual({
      state: "has",
      label: "1시간 30분",
    });
  });
});
