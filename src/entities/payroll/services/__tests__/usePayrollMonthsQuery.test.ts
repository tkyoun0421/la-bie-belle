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
const { usePayrollMonthsQuery } =
  await import("@/entities/payroll/services/usePayrollMonthsQuery");

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

  return { wrapper };
}

const FAKE_CLIENT = {} as never;

function monthPayload(month: string) {
  return {
    wageRates: [
      {
        profile_id: "p1",
        effective_date: `${month}-01`,
        amount: 11000,
        follows_default: true,
      },
    ],
    adjustments: [
      {
        id: `adj-${month}`,
        day_id: "d1",
        profile_id: "p1",
        minutes: 30,
        adjusted_at: `${month}-01T00:00:00.000Z`,
      },
    ],
    excuseStatus: [
      {
        day_id: `d-${month}`,
        profile_id: "p1",
        submitted_at: `${month}-01T00:00:00.000Z`,
        decided_at: null,
        decision: null,
      },
    ],
    holidays: [
      {
        holiday_date: `${month}-25`,
        source: "api",
        name: `${month} holiday`,
      },
    ],
  };
}

beforeEach(() => {
  getPayrollMonthMock.mockReset();
});

describe("usePayrollMonthsQuery — 요청한 달 수만큼 쿼리가 열린다", () => {
  it("연이면 열두 달을 각각 한 번씩 읽는다", async () => {
    getPayrollMonthMock.mockImplementation(async (_client, month) =>
      monthPayload(month as string),
    );
    const months = Array.from(
      { length: 12 },
      (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsQuery(FAKE_CLIENT, months),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const calledMonths = getPayrollMonthMock.mock.calls.map((call) => call[1]);
    expect(new Set(calledMonths)).toEqual(new Set(months));
    expect(getPayrollMonthMock).toHaveBeenCalledTimes(12);
  });
});

describe("usePayrollMonthsQuery — 하나라도 pending이면 로딩이다", () => {
  it("한 달은 응답하고 한 달은 안 끝나면 isLoading이 true다", async () => {
    getPayrollMonthMock.mockImplementation(async (_client, month) => {
      if (month === "2026-09") {
        return monthPayload(month as string);
      }
      return new Promise(() => {});
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(getPayrollMonthMock).toHaveBeenCalledTimes(2));

    expect(result.current.isLoading).toBe(true);
  });
});

describe("usePayrollMonthsQuery — 하나라도 error면 그 error가 표면에 뜬다", () => {
  it("한 달이 실패하면 error에 그 이유가 담긴다", async () => {
    const failure = new Error("month read failed");
    getPayrollMonthMock.mockImplementation(async (_client, month) => {
      if (month === "2026-10") {
        throw failure;
      }
      return monthPayload(month as string);
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe("month read failed");
  });
});

describe("usePayrollMonthsQuery — 전부 오면 달치가 합쳐져 나온다", () => {
  it("두 달의 wageRates·adjustments·excuseStatus가 하나로 이어진다", async () => {
    getPayrollMonthMock.mockImplementation(async (_client, month) =>
      monthPayload(month as string),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.adjustments).toHaveLength(2);
    expect(
      result.current.data?.adjustments.map((row: { id: string }) => row.id),
    ).toEqual(expect.arrayContaining(["adj-2026-09", "adj-2026-10"]));
  });

  it("두 달의 holidays가 달 순서를 따라 하나로 합쳐진다", async () => {
    getPayrollMonthMock.mockImplementation(async (_client, month) =>
      monthPayload(month as string),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(
      result.current.data?.holidays.map(
        (row: { holiday_date: string }) => row.holiday_date,
      ),
    ).toEqual(["2026-09-25", "2026-10-25"]);
  });

  it("한 달의 holidays가 비어 있어도 나머지 달의 것이 그대로 나온다", async () => {
    getPayrollMonthMock.mockImplementation(async (_client, month) => {
      const payload = monthPayload(month as string);
      if (month === "2026-09") {
        return { ...payload, holidays: [] };
      }
      return payload;
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => usePayrollMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(
      result.current.data?.holidays.map(
        (row: { holiday_date: string }) => row.holiday_date,
      ),
    ).toEqual(["2026-10-25"]);
  });
});
