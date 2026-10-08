const { combineMonths } = await import("@/shared/api/monthsQuery");

const MONTHS = ["2026-08", "2026-09", "2026-10"];

function loaded(data: unknown) {
  return { data, isPending: false, error: null };
}

describe("combineMonths — 칸 수가 달 수와 같다", () => {
  it("빈 달이 섞여 있어도 data 길이가 요청한 달 수다", () => {
    const results = [loaded([1, 2, 3]), loaded([]), loaded([])];

    const months = combineMonths(results, MONTHS, (at) => ({
      month: MONTHS[at],
      rows: results[at].data,
    }));

    expect(months.data).toHaveLength(3);
    expect(months.data?.[1]).toEqual({ month: "2026-09", rows: [] });
  });

  it("칸 만드는 손이 질의 자리를 직접 골라 달 하나가 질의 둘인 꼴도 접힌다", () => {
    const results = [
      loaded("근무1"),
      loaded("근무2"),
      loaded("근태1"),
      loaded("근태2"),
    ];
    const twoMonths = ["2026-08", "2026-09"];

    const months = combineMonths(results, twoMonths, (at) => ({
      month: twoMonths[at],
      work: results[at].data,
      attendance: results[twoMonths.length + at].data,
    }));

    expect(months.data).toEqual([
      { month: "2026-08", work: "근무1", attendance: "근태1" },
      { month: "2026-09", work: "근무2", attendance: "근태2" },
    ]);
  });
});

describe("combineMonths — 하나라도 안 오면 로딩이다", () => {
  it("한 칸이 undefined면 data가 undefined다", () => {
    const results = [
      loaded([1]),
      { data: undefined, isPending: true, error: null },
    ];

    const months = combineMonths(results, ["2026-08", "2026-09"], (at) => at);

    expect(months.data).toBeUndefined();
    expect(months.isLoading).toBe(true);
  });

  it("데이터가 다 와도 하나가 아직 pending이면 isLoading이 참이다", () => {
    const results = [loaded([1]), { data: [2], isPending: true, error: null }];

    const months = combineMonths(results, ["2026-08", "2026-09"], (at) => at);

    expect(months.data).toEqual([0, 1]);
    expect(months.isLoading).toBe(true);
  });
});

describe("combineMonths — 처음 만난 오류를 낸다", () => {
  it("오류가 둘이면 앞의 것을 낸다", () => {
    const first = new Error("8월이 안 왔다");
    const second = new Error("9월도 안 왔다");
    const results = [
      { data: undefined, isPending: false, error: first },
      { data: undefined, isPending: false, error: second },
    ];

    const months = combineMonths(results, ["2026-08", "2026-09"], (at) => at);

    expect(months.error).toBe(first);
  });

  it("오류가 없으면 null이다", () => {
    const months = combineMonths([loaded([1])], ["2026-08"], (at) => at);

    expect(months.error).toBeNull();
  });
});
