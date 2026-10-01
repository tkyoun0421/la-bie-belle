import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getWageRatesMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/payroll/api/getWageRates.api", () => ({
  getWageRates: getWageRatesMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useWageRatesQuery } =
  await import("@/entities/payroll/hooks/useWageRatesQuery");

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

const WAGE_RATES = {
  wageRates: [
    {
      profile_id: "profile-1",
      effective_date: "2026-01-01",
      amount: 11000,
      follows_default: true,
    },
  ],
  defaultWage: 11000,
};

beforeEach(() => {
  getWageRatesMock.mockReset();
});

describe("useWageRatesQuery — getWageRates를 그대로 낸다", () => {
  it("응답하면 DAL의 반환값을 그대로 data에 낸다", async () => {
    getWageRatesMock.mockResolvedValue(WAGE_RATES);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useWageRatesQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(WAGE_RATES);
  });
});

describe("useWageRatesQuery — 캐시 키는 ['payroll', 'wages']다", () => {
  it("쿼리 데이터가 그 리터럴 키에 앉는다", async () => {
    getWageRatesMock.mockResolvedValue(WAGE_RATES);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useWageRatesQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["payroll", "wages"])).toEqual(WAGE_RATES);
  });
});
