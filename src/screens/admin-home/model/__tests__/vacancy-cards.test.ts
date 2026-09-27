// 구현 대상: src/screens/admin-home/model/vacancy-cards.ts
//
// 빈 자리 카드다(admin-home.md 「빈 자리 카드」) — 예식이 사흘 안인데 자리가 비어 있는
// 날마다 한 장, 없으면 이 자리가 통째로 없다. 사흘 기준은 NTF-013과 같다. 시나리오는
// admin-home.md의 확정 뒤 예시와 같다 — 오늘 2026-10-08(목).

import {
  vacancyCards,
  vacancyDaysLeftLine,
} from "@/screens/admin-home/model/vacancy-cards";

const TODAY = "2026-10-08T00:00:00Z";

describe("vacancyCards — 예식이 사흘 안인데 빈 자리가 남은 날마다 한 장이다", () => {
  it("2일 뒤에 빈 자리가 있으면 카드 하나가 선다", () => {
    const cards = vacancyCards({
      days: [{ workDate: "2026-10-10", vacancyCount: 1 }],
      now: TODAY,
    });

    expect(cards).toEqual([
      { workDate: "2026-10-10", vacancyCount: 1, daysLeft: 2 },
    ]);
  });

  it("사흘 뒤(경계)까지는 포함된다", () => {
    const cards = vacancyCards({
      days: [{ workDate: "2026-10-11", vacancyCount: 2 }],
      now: TODAY,
    });

    expect(cards).toHaveLength(1);
  });

  it("나흘 뒤는 빠진다", () => {
    const cards = vacancyCards({
      days: [{ workDate: "2026-10-12", vacancyCount: 2 }],
      now: TODAY,
    });

    expect(cards).toHaveLength(0);
  });
});

describe("vacancyCards — 빈 자리가 0인 날은 카드가 안 선다", () => {
  it("사흘 안이어도 vacancyCount가 0이면 빠진다", () => {
    const cards = vacancyCards({
      days: [{ workDate: "2026-10-10", vacancyCount: 0 }],
      now: TODAY,
    });

    expect(cards).toHaveLength(0);
  });
});

describe("vacancyCards — 대상이 없으면 빈 배열이다", () => {
  it("days가 비어 있으면 빈 배열이다", () => {
    expect(vacancyCards({ days: [], now: TODAY })).toEqual([]);
  });
});

describe("vacancyDaysLeftLine — 남은 날을 말하고 당일이면 다른 문구다", () => {
  it("2일 남았으면 「2일 남았어요」다", () => {
    expect(vacancyDaysLeftLine(2)).toBe("2일 남았어요");
  });

  it("당일(0)이면 「오늘이에요」다", () => {
    expect(vacancyDaysLeftLine(0)).toBe("오늘이에요");
  });
});
