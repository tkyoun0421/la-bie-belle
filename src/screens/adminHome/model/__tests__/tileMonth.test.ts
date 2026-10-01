// 구현 대상: src/screens/adminHome/model/tileMonth.ts
//
// 근무표 관리 타일이 말하는 달이다(admin-home.md 「근무표 관리만 카드다」). 오늘이 든 달이
// 기본이고, 그 달이 이미 확정됐으면 다음 달이다 — 타일의 일은 「지금 만드는 근무표가
// 어디까지 왔나」라, 확정된 달을 계속 말하면 월말에 다음 달을 만들러 가는 길이 안 보인다.
// 오늘 현황과 미니뷰는 이 값을 안 쓴다 — 둘은 늘 오늘이 든 달이다.

import { tileMonth } from "@/screens/adminHome/model/tileMonth";

describe("tileMonth — 오늘이 든 달이 확정되지 않았으면 그 달이다", () => {
  it("9월이 아직 없으면 9월이다", () => {
    expect(
      tileMonth({ todayMonth: "2026-09", todayMonthConfirmed: false }),
    ).toBe("2026-09");
  });
});

describe("tileMonth — 오늘이 든 달이 확정됐으면 다음 달이다", () => {
  it("9월이 확정됐으면 10월이다", () => {
    expect(
      tileMonth({ todayMonth: "2026-09", todayMonthConfirmed: true }),
    ).toBe("2026-10");
  });

  it("12월이 확정됐으면 해를 넘겨 다음 해 1월이다", () => {
    expect(
      tileMonth({ todayMonth: "2026-12", todayMonthConfirmed: true }),
    ).toBe("2027-01");
  });
});
