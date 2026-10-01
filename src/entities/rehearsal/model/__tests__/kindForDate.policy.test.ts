// 구현 대상: src/entities/rehearsal/model/kindForDate.ts
//
// 화면이 시트를 열기 전에 입력 모양을 고르는 판정이다(plan AC-04) — 그날 살아 있는 정규
// 배정이 있으면 건수 갈래, 없으면 시각 갈래다. 교육 배정은 안 센다(design.md 「리허설」).
// SQL 쪽(add_rehearsal)이 정본이고 이 함수는 화면이 입력 모양을 미리 고르는 용도라 어긋나면
// 저장이 wrong_kind로 다시 받는다.

import { kindForDate } from "@/entities/rehearsal/model/kindForDate.policy";

const DATE = "2026-10-10";

describe("kindForDate — 살아 있는 정규 배정이 있으면 건수 갈래다", () => {
  it("그날 살아 있는 정규 배정이 있으면 count다", () => {
    const kind = kindForDate(DATE, [
      { work_date: DATE, kind: "regular", ended_at: null },
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
      { work_date: "2026-10-11", kind: "regular", ended_at: null },
    ]);

    expect(kind).toBe("time");
  });
});

describe("kindForDate — 교육 배정은 안 센다", () => {
  it("그날 교육 배정만 있으면 time이다", () => {
    const kind = kindForDate(DATE, [
      { work_date: DATE, kind: "training", ended_at: null },
    ]);

    expect(kind).toBe("time");
  });
});

describe("kindForDate — 끝난 정규 배정은 안 센다", () => {
  it("그날 정규 배정이 있어도 ended_at이 있으면 time이다", () => {
    const kind = kindForDate(DATE, [
      { work_date: DATE, kind: "regular", ended_at: "2026-10-05T00:00:00Z" },
    ]);

    expect(kind).toBe("time");
  });
});
