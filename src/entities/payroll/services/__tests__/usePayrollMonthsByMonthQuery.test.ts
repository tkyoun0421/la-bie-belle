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
  await import("@/entities/payroll/services/usePayrollMonthsByMonthQuery");

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
