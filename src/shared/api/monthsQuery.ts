/**
 * 달치 창을 읽는 훅들이 나눠 쓰는 꼴이다. 추이 그래프는 「몇 월이 비었나」를 알아야 해서
 * 여러 달의 행을 한 배열로 이어 붙이면 안 되고, 달마다 한 칸으로 와야 한다 — 값이 없는
 * 달과 0인 달이 거기서 갈린다.
 *
 * 이 자리가 `shared`인 것은 `entities/schedule`·`entities/payroll`·`entities/attendance`
 * 셋이 같이 쓰기 때문이다. 같은 층 슬라이스끼리는 서로를 못 부른다(lint 규칙 3).
 */

export type MonthsResult<Loaded> = {
  data: Loaded[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

type QueryResult = {
  data: unknown;
  isPending: boolean;
  error: Error | null;
};

/**
 * 결과 배열을 달 수만큼의 칸으로 접는다. 질의와 칸이 일대일이 아닐 수 있어 — 달 하나가
 * 질의 둘인 경우가 있다 — 그 대응을 아는 것은 부르는 쪽이고, 칸 만드는 손을 받아 쓴다.
 *
 * **하나라도 안 오면 로딩이다.** 달 하나가 빠진 채 그리면 그 달만 값이 없는 것으로 읽혀
 * 「앱을 쓰기 전 달」과 구별되지 않는다.
 */
export function combineMonths<Loaded>(
  results: readonly QueryResult[],
  months: readonly string[],
  monthAt: (at: number) => Loaded,
): MonthsResult<Loaded> {
  const loaded = results.every((result) => result.data !== undefined);

  return {
    data: loaded ? months.map((_month, at) => monthAt(at)) : undefined,
    isLoading: results.some((result) => result.isPending),
    error: results.find((result) => result.error !== null)?.error ?? null,
  };
}
