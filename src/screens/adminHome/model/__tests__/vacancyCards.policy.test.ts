import {
  vacancyCards,
  vacancyDaysLeftLine,
  vacancyDaysOf,
} from "@/screens/adminHome/model/vacancyCards.policy";

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

describe("vacancyDaysOf — 같은 날짜의 슬롯이 여럿이면 한 행으로 묶여 수가 된다", () => {
  it("같은 날짜 슬롯 셋이 vacancyCount 3인 행 하나로 묶인다", () => {
    const days = vacancyDaysOf([
      { workDate: "2026-10-10" },
      { workDate: "2026-10-10" },
      { workDate: "2026-10-10" },
    ]);

    expect(days).toEqual([{ workDate: "2026-10-10", vacancyCount: 3 }]);
  });
});

describe("vacancyDaysOf — 대상이 없으면 빈 배열이다", () => {
  it("슬롯이 없으면 빈 배열이다", () => {
    expect(vacancyDaysOf([])).toEqual([]);
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
