import { buildTrend, trendMonths } from "@/features/stats/utils/trend.utils";

describe("trendMonths — 보는 달이 오른쪽 끝인 열두 달이다", () => {
  it("2026년 10월을 보면 2025년 11월부터 2026년 10월까지 열두 달이다", () => {
    const months = trendMonths("2026-10");

    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2025-11");
    expect(months[11]).toBe("2026-10");
  });
});

describe("trendMonths — 이전 달로 가면 창 전체가 한 칸 밀린다", () => {
  it("2026년 9월을 보면 열두 달이 한 달 앞으로 당겨진다", () => {
    const currentWindow = trendMonths("2026-10");
    const previousWindow = trendMonths("2026-09");

    expect(previousWindow[11]).toBe("2026-09");
    expect(previousWindow[0]).toBe("2025-10");
    expect(previousWindow).not.toEqual(currentWindow);
  });
});

describe("buildTrend — 값이 없는 달은 null이라 선이 끊긴다", () => {
  it("valueByMonth에 없는 달은 value가 null이다", () => {
    const months = ["2026-08", "2026-09", "2026-10"];
    const valueByMonth = new Map([
      ["2026-09", 0],
      ["2026-10", 120],
    ]);

    const points = buildTrend(months, valueByMonth);

    expect(points).toEqual([
      { month: "2026-08", value: null },
      { month: "2026-09", value: 0 },
      { month: "2026-10", value: 120 },
    ]);
  });
});

describe("buildTrend — 0인 달과 값이 없는 달이 다르다", () => {
  it("0으로 등록된 달은 null이 아니라 0이다", () => {
    const points = buildTrend(["2026-09"], new Map([["2026-09", 0]]));

    expect(points[0].value).toBe(0);
    expect(points[0].value).not.toBeNull();
  });

  it("등록 자체가 없는 달은 0이 아니라 null이다", () => {
    const points = buildTrend(["2026-09"], new Map());

    expect(points[0].value).toBeNull();
  });
});

describe("buildTrend — month 순서를 그대로 유지한다", () => {
  it("입력 months 배열의 순서와 같은 순서로 TrendPoint가 나온다", () => {
    const months = ["2026-08", "2026-09", "2026-10"];

    const points = buildTrend(months, new Map());

    expect(points.map((point) => point.month)).toEqual(months);
  });
});
