// 구현 대상: src/entities/payroll/hooks/usePayrollMonthsByMonthQuery.ts
//
// usePayrollMonthsByMonthQuery(client, months) — 급여 탭 그래프가 쓰는 달치 창이다.
// `usePayrollMonthsQuery`가 이미 달치를 읽지만 그쪽은 mergeMonths가 flatMap으로 여러
// 달을 하나로 뭉갠다 — 추이 그래프는 달마다 구분된 값이 필요해 그대로 못 쓴다.
//
// **키가 usePayrollMonthsQuery의 것과 같다.** `queryKeys.payroll.month`를 그대로 불러서
// 급여 화면이 읽어둔 달은 캐시에서 오고, 조정이나 시급을 고쳐 `['payroll']`이 낡으면 이
// 화면도 같이 따라간다.
//
// `features/stats/api/useStatsQueries.ts`에서 갈라져 나왔다 — 아래 단언은 그 파일의
// 짝 테스트가 들고 있던 것과 같다(fsd-read-write-layers AC-05).

import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getPayrollMonthMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/payroll/api/getPayrollMonth.api", () => ({
  getPayrollMonth: getPayrollMonthMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { usePayrollMonthsByMonthQuery } =
  await import("@/entities/payroll/hooks/usePayrollMonthsByMonthQuery");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

const TWELVE_MONTHS = Array.from(
  { length: 12 },
  (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
);

function emptyPayrollMonth() {
  return { wageRates: [], adjustments: [], excuseStatus: [], holidays: [] };
}

function emptyPayrollMonth1WageRate() {
  return {
    ...emptyPayrollMonth(),
    wageRates: [
      {
        profile_id: "profile-1",
        effective_date: "2026-08-01",
        amount: 12000,
        follows_default: false,
      },
    ],
  };
}

beforeEach(() => {
  getPayrollMonthMock.mockReset();
});

describe("usePayrollMonthsByMonthQuery — 달마다 getPayrollMonth를 부른다", () => {
  it("열두 달이면 getPayrollMonth가 정확히 12번 불린다", async () => {
    getPayrollMonthMock.mockImplementation(async () => emptyPayrollMonth());
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsByMonthQuery(FAKE_CLIENT, TWELVE_MONTHS),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getPayrollMonthMock).toHaveBeenCalledTimes(12);
  });
});

describe("usePayrollMonthsByMonthQuery — 결과가 달마다 구분돼 돌아온다(flatMap으로 안 뭉갠다)", () => {
  it("한 달은 시급 행이 있고 한 달은 빈 달이어도 data 길이가 달 수(2)와 같다", async () => {
    getPayrollMonthMock.mockImplementation(async (_client, month) =>
      month === "2026-08" ? emptyPayrollMonth1WageRate() : emptyPayrollMonth(),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsByMonthQuery(FAKE_CLIENT, ["2026-08", "2026-09"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.month).toBe("2026-08");
    expect(result.current.data?.[0]?.payroll.wageRates).toHaveLength(1);
    expect(result.current.data?.[1]?.month).toBe("2026-09");
    expect(result.current.data?.[1]?.payroll.wageRates).toHaveLength(0);
  });

  it("빈 달이 있어도 data 길이가 요청한 달 수와 같다(하나라도 안 오면 로딩)", async () => {
    getPayrollMonthMock.mockImplementation(async () => emptyPayrollMonth());
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        usePayrollMonthsByMonthQuery(FAKE_CLIENT, [
          "2026-08",
          "2026-09",
          "2026-10",
        ]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(3);
  });
});

describe("usePayrollMonthsByMonthQuery — 급여 화면과 캐시를 나눈다", () => {
  it("달마다 ['payroll', 'YYYY-MM'] 자리에 값이 앉는다", async () => {
    getPayrollMonthMock.mockImplementation(async () => emptyPayrollMonth());
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsByMonthQuery(FAKE_CLIENT, ["2026-08"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["payroll", "2026-08"])).toEqual(
      emptyPayrollMonth(),
    );
  });
});
