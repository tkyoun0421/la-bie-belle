import { tileMonth } from "@/shared/model/tileMonth.policy";

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
