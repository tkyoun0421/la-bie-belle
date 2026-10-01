// 구현 대상: src/screens/adminHome/model/homeTileSummary.policy.ts
//
// 근무표 관리 타일 안 요약 줄이다. 문안 표(admin-home.md 「관리자 홈 문안」) 그대로다 —
// 아직 없음 / 만드는 중(열린 날 수·빈 자리 수) / 확정 뒤(빈 자리 수).

import { homeTileSummary } from "@/screens/adminHome/model/homeTileSummary.policy";

describe("homeTileSummary — 근무표가 없으면 아직 없다는 문장이다", () => {
  it("10월이면 「10월 근무표가 아직 없어요」다", () => {
    const summary = homeTileSummary({ state: "not_created", month: "2026-10" });

    expect(summary).toBe("10월 근무표가 아직 없어요");
  });
});

describe("homeTileSummary — 만드는 중이면 열린 날과 빈 자리 수를 말한다", () => {
  it("열린 날 9, 빈 자리 6이면 「10월 근무표 · 열린 날 9 · 빈 자리 6」이다", () => {
    const summary = homeTileSummary({
      state: "in_progress",
      month: "2026-10",
      openDays: 9,
      vacancyCount: 6,
    });

    expect(summary).toBe("10월 근무표 · 열린 날 9 · 빈 자리 6");
  });
});

describe("homeTileSummary — 확정 뒤에는 확정 사실과 빈 자리 수를 말한다", () => {
  it("빈 자리 2면 「10월 근무표를 확정했어요 · 빈 자리 2」다", () => {
    const summary = homeTileSummary({
      state: "confirmed",
      month: "2026-10",
      vacancyCount: 2,
    });

    expect(summary).toBe("10월 근무표를 확정했어요 · 빈 자리 2");
  });
});
