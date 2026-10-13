import { monthRange } from "@/entities/rehearsal/utils/rehearsalMonthRange.utils";

describe("monthRange — 달의 첫날과 마지막 날을 돌려준다", () => {
  it("서른한 날 달", () => {
    expect(monthRange("2026-10")).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("윤년 이월은 스물아홉 날까지다", () => {
    expect(monthRange("2028-02")).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });

  it("평년 이월은 스물여덟 날까지다", () => {
    expect(monthRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });
});
