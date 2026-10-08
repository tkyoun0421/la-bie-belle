import { kindForDate } from "@/entities/rehearsal/model/kindForDate.policy";

const DATE = "2026-10-10";

describe("kindForDate — 살아 있는 정규 배정이 있으면 건수 갈래다", () => {
  it("그날 살아 있는 정규 배정이 있으면 count다", () => {
    const kind = kindForDate(DATE, [
      { workDate: DATE, kind: "regular", endedAt: null },
    ]);

    expect(kind).toBe("count");
  });
});

describe("kindForDate — 배정이 없으면 시각 갈래다", () => {
  it("그날 배정이 하나도 없으면 time이다", () => {
    expect(kindForDate(DATE, [])).toBe("time");
  });

  it("배정이 다른 날짜의 것이면 time이다", () => {
    const kind = kindForDate(DATE, [
      { workDate: "2026-10-11", kind: "regular", endedAt: null },
    ]);

    expect(kind).toBe("time");
  });
});

describe("kindForDate — 교육 배정은 안 센다", () => {
  it("그날 교육 배정만 있으면 time이다", () => {
    const kind = kindForDate(DATE, [
      { workDate: DATE, kind: "training", endedAt: null },
    ]);

    expect(kind).toBe("time");
  });
});

describe("kindForDate — 끝난 정규 배정은 안 센다", () => {
  it("그날 정규 배정이 있어도 endedAt이 있으면 time이다", () => {
    const kind = kindForDate(DATE, [
      { workDate: DATE, kind: "regular", endedAt: "2026-10-05T00:00:00Z" },
    ]);

    expect(kind).toBe("time");
  });
});
