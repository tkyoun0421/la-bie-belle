// 구현 대상: src/screens/admin-home/model/today-status.ts
//
// 오늘 현황 자리다(admin-home.md 「오늘 현황」) — 근무가 없는 날은 자리가 통째로 없고,
// 확정 전에는 값이 「–」다. 확정 뒤라야 배정 인원·출근 수·안 찍음·띠 비율을 낸다.

import { todayStatus } from "@/screens/admin-home/model/today-status";

describe("todayStatus — 그날 배정이 없으면 자리가 통째로 없다", () => {
  it("assignedCount가 0이면 kind가 none이다", () => {
    const status = todayStatus({
      isConfirmed: true,
      assignedCount: 0,
      checkedInCount: 0,
    });

    expect(status).toEqual({ kind: "none" });
  });
});

describe("todayStatus — 배정은 있지만 확정 전이면 값이 –다", () => {
  it("assignedCount가 있어도 확정 전이면 kind가 unconfirmed다", () => {
    const status = todayStatus({
      isConfirmed: false,
      assignedCount: 9,
      checkedInCount: 0,
    });

    expect(status).toEqual({ kind: "unconfirmed" });
  });
});

describe("todayStatus — 확정 뒤에는 배정·출근·안 찍음·띠 비율을 낸다", () => {
  it("9명 배정에 7명 출근이면 안 찍음 2, 비율 7/9다", () => {
    const status = todayStatus({
      isConfirmed: true,
      assignedCount: 9,
      checkedInCount: 7,
    });

    expect(status).toEqual({
      kind: "value",
      assignedCount: 9,
      checkedInCount: 7,
      notCheckedInCount: 2,
      bandRatio: 7 / 9,
    });
  });

  it("전원 출근이면 안 찍음이 0이고 비율이 1이다", () => {
    const status = todayStatus({
      isConfirmed: true,
      assignedCount: 5,
      checkedInCount: 5,
    });

    expect(status).toEqual({
      kind: "value",
      assignedCount: 5,
      checkedInCount: 5,
      notCheckedInCount: 0,
      bandRatio: 1,
    });
  });
});
