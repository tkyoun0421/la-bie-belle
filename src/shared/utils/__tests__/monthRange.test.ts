// 구현 대상: src/shared/utils/monthRange.ts
//
// dal 넷이 각자 들고 있던 사본을 한 자리로 모은다. 달치 질의는 전부
// `gte(monthStart) & lt(nextMonthStart)`로 창을 잡아서, 이 둘이 어긋나면 달
// 경계의 하루가 두 달에 같이 세어지거나 아무 달에도 안 센다.

import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";

describe("monthStart", () => {
  it("달만 준 것도 날까지 준 것도 그 달 1일이다", () => {
    expect(monthStart("2026-12")).toBe("2026-12-01");
    expect(monthStart("2026-12-25")).toBe("2026-12-01");
  });

  it("한 자리 달도 두 자리로 적힌 그대로 산다", () => {
    expect(monthStart("2026-01")).toBe("2026-01-01");
  });
});

describe("nextMonthStart", () => {
  it("다음 달 1일이다", () => {
    expect(nextMonthStart("2026-01")).toBe("2026-02-01");
    expect(nextMonthStart("2026-11")).toBe("2026-12-01");
  });

  it("12월은 해를 넘긴다", () => {
    expect(nextMonthStart("2026-12")).toBe("2027-01-01");
  });

  it("날까지 준 것도 달만 보고 넘긴다", () => {
    expect(nextMonthStart("2026-12-25")).toBe("2027-01-01");
  });

  it("두 자리로 채운다", () => {
    expect(nextMonthStart("2026-09")).toBe("2026-10-01");
  });
});
