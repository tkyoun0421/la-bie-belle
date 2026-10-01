// 구현 대상: src/screens/payroll/model/boundary.ts
//
// Period는 period.ts와 같은 꼴이다 — { unit: "week"; weekStart } |
// { unit: "month"; month } | { unit: "year"; year }.
//
// canGoBack(period, approvedAt) — 뒤로 가는 화살표가 서는지다. 바닥은 승인된
// 달이다(첫 근무가 아니다 — payroll.md 「첫 달 앞」). approvedAt이 든 기간과
// 같으면 더 뒤로 못 간다.
//
// canGoForward(period, { today, leftAt }) — 앞으로 가는 화살표가 서는지다.
// today(kstToday())가 든 기간 다음으로 못 간다. leftAt(퇴사한 달)이 있으면
// 그 달이 바닥이 아니라 천장이 된다 — 퇴사한 달에서 앞으로가 사라진다.

import {
  canGoBack,
  canGoForward,
} from "@/screens/payroll/model/boundary.policy";

describe("canGoBack — 승인된 달과 같은 기간이면 뒤로 화살표가 사라진다", () => {
  it("승인일 2026-08-15가 든 달은 false다", () => {
    expect(canGoBack({ unit: "month", month: "2026-08" }, "2026-08-15")).toBe(
      false,
    );
  });
});

describe("canGoBack — 승인된 달보다 나중 기간이면 뒤로 화살표가 산다", () => {
  it("승인 다음 달은 true다", () => {
    expect(canGoBack({ unit: "month", month: "2026-09" }, "2026-08-15")).toBe(
      true,
    );
  });
});

describe("canGoBack — 주 단위도 승인 주가 바닥이다", () => {
  it("승인일 2026-08-31이 든 주(월요일 시작)는 false다", () => {
    expect(
      canGoBack({ unit: "week", weekStart: "2026-08-31" }, "2026-08-31"),
    ).toBe(false);
  });

  it("그 다음 주는 true다", () => {
    expect(
      canGoBack({ unit: "week", weekStart: "2026-09-07" }, "2026-08-31"),
    ).toBe(true);
  });
});

describe("canGoBack — 연 단위도 승인 연이 바닥이다", () => {
  it("승인일 2026-03-01이 든 연은 false다", () => {
    expect(canGoBack({ unit: "year", year: "2026" }, "2026-03-01")).toBe(false);
  });
});

describe("canGoForward — 오늘이 든 달 다음으로 못 간다", () => {
  it("오늘 2026-09-15가 든 달은 false다", () => {
    expect(
      canGoForward(
        { unit: "month", month: "2026-09" },
        { today: "2026-09-15", leftAt: null },
      ),
    ).toBe(false);
  });
});

describe("canGoForward — 오늘보다 이전 달은 화살표가 산다", () => {
  it("오늘이 든 달의 이전 달은 true다", () => {
    expect(
      canGoForward(
        { unit: "month", month: "2026-08" },
        { today: "2026-09-15", leftAt: null },
      ),
    ).toBe(true);
  });
});

describe("canGoForward — 오늘이 든 주 다음으로 못 간다", () => {
  it("오늘 2026-09-15가 든 주(2026-09-14 시작)는 false다", () => {
    expect(
      canGoForward(
        { unit: "week", weekStart: "2026-09-14" },
        { today: "2026-09-15", leftAt: null },
      ),
    ).toBe(false);
  });
});

describe("canGoForward — 오늘이 든 연 다음으로 못 간다", () => {
  it("오늘 2026-09-15가 든 연은 false다", () => {
    expect(
      canGoForward(
        { unit: "year", year: "2026" },
        { today: "2026-09-15", leftAt: null },
      ),
    ).toBe(false);
  });
});

describe("canGoForward — 퇴사자는 퇴사한 달에서 앞으로가 사라진다", () => {
  it("퇴사일 2026-07-31이 든 달은 오늘이 더 나중이어도 false다", () => {
    expect(
      canGoForward(
        { unit: "month", month: "2026-07" },
        { today: "2026-09-15", leftAt: "2026-07-31" },
      ),
    ).toBe(false);
  });
});

describe("canGoForward — 퇴사자도 퇴사한 달 이전은 화살표가 산다", () => {
  it("퇴사한 달의 이전 달은 true다", () => {
    expect(
      canGoForward(
        { unit: "month", month: "2026-06" },
        { today: "2026-09-15", leftAt: "2026-07-31" },
      ),
    ).toBe(true);
  });
});
