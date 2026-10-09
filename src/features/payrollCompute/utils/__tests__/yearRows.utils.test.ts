import {
  monthRowsOfDays,
  yearRows,
} from "@/features/payrollCompute/utils/yearRows.utils";

describe("yearRows — 최근이 위다(12월이 맨 위, 1월이 맨 아래)", () => {
  it("입력 순서와 무관하게 달을 내림차순으로 접는다", () => {
    const rows = yearRows([
      { month: "2026-01", amount: 100000 },
      { month: "2026-03", amount: 300000 },
      { month: "2026-02", amount: 200000 },
    ]);

    const months = rows.flatMap((row) =>
      row.type === "month" ? [row.month] : [],
    );

    expect(months).toEqual(["2026-03", "2026-02", "2026-01"]);
  });
});

describe("yearRows — 합계 줄이 맨 아래에 붙는다", () => {
  it("합계 줄의 type이 'total'이고 목록 마지막이다", () => {
    const rows = yearRows([
      { month: "2026-01", amount: 100000 },
      { month: "2026-02", amount: 200000 },
    ]);

    expect(rows[rows.length - 1].type).toBe("total");
  });
});

describe("yearRows — 달 줄의 금액은 그 달 합과 같다", () => {
  it("2026-10의 금액이 108,000원이면 그 줄도 108,000원이다", () => {
    const rows = yearRows([{ month: "2026-10", amount: 108000 }]);
    const monthRow = rows.find((row) => row.type === "month");

    expect(monthRow?.amountLabel).toBe("108,000원");
  });
});

describe("yearRows — 합계는 열두(또는 주어진 모든) 달의 합이다", () => {
  it("100,000 + 200,000 + 300,000은 600,000원이다", () => {
    const rows = yearRows([
      { month: "2026-01", amount: 100000 },
      { month: "2026-02", amount: 200000 },
      { month: "2026-03", amount: 300000 },
    ]);

    const totalRow = rows.find((row) => row.type === "total");

    expect(totalRow?.amountLabel).toBe("600,000원");
  });
});

describe("yearRows — 합계 줄은 달 개수와 무관하게 항상 선다", () => {
  it("달이 하나뿐이어도 합계 줄이 그 달과 같은 값으로 선다", () => {
    const rows = yearRows([{ month: "2026-06", amount: 50000 }]);

    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual({ type: "total", amountLabel: "50,000원" });
  });
});

describe("monthRowsOfDays — 날이 있는 달만 줄로 선다", () => {
  it("1월과 3월에만 날이 있으면 2월 줄은 없다", () => {
    const rows = monthRowsOfDays([
      { date: "2026-01-05", amount: 10000 },
      { date: "2026-03-10", amount: 20000 },
    ]);

    expect(rows.map((row) => row.month).sort()).toEqual(["2026-01", "2026-03"]);
  });
});

describe("monthRowsOfDays — 한 달에 여러 날이면 금액이 합쳐진다", () => {
  it("같은 달 세 날의 금액이 한 줄로 더해진다", () => {
    const rows = monthRowsOfDays([
      { date: "2026-06-01", amount: 10000 },
      { date: "2026-06-15", amount: 20000 },
      { date: "2026-06-30", amount: 5000 },
    ]);

    expect(rows).toEqual([{ month: "2026-06", amount: 35000 }]);
  });
});

describe("monthRowsOfDays — 날이 하나도 없으면 빈 배열이다", () => {
  it("빈 목록을 넣으면 달 줄도 없다", () => {
    expect(monthRowsOfDays([])).toEqual([]);
  });
});
