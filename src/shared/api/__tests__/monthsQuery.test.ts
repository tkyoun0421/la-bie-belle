// 구현 대상: src/shared/api/monthsQuery.ts
//
// combineMonths(results, months, monthAt) — 달치 창을 읽는 훅들이 나눠 쓰는 접기다.
// `features/stats/api/useStatsQueries.ts`에 사설로 있던 것을 `shared/api`로 올렸다 —
// entities 세 슬라이스가 같이 쓰는데 같은 층끼리는 서로를 못 부른다(lint 규칙 3).
//
// 단언 둘이 이 함수의 값이다. ①달 수만큼의 칸이 나온다 — 빈 달도 칸을 차지해서
// 「값이 없는 달」과 「0인 달」이 갈린다. ②하나라도 안 오면 data가 undefined다 —
// 달 하나가 빠진 채 그리면 그 달만 「앱을 쓰기 전」으로 읽힌다.

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
