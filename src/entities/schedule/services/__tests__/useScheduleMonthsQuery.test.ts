import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthSchedule: getMonthScheduleMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useScheduleMonthsQuery } =
  await import("@/entities/schedule/services/useScheduleMonthsQuery");

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

function dayFor(month: string) {
  return {
    id: `day-${month}`,
    work_date: `${month}-10`,
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    opened_at: `${month}-01T00:00:00.000Z`,
    slots: [],
    assignments: [],
    check_ins: [],
  };
}

beforeEach(() => {
  getMonthScheduleMock.mockReset();
});

describe("useScheduleMonthsQuery — 요청한 달 수만큼 쿼리가 열린다", () => {
  it("연이면 열두 달을 각각 한 번씩 읽는다", async () => {
    getMonthScheduleMock.mockImplementation(async (_client, month) => [
      dayFor(month as string),
    ]);
    const months = Array.from(
      { length: 12 },
      (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useScheduleMonthsQuery(FAKE_CLIENT, months),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const calledMonths = getMonthScheduleMock.mock.calls.map((call) => call[1]);
    expect(new Set(calledMonths)).toEqual(new Set(months));
    expect(getMonthScheduleMock).toHaveBeenCalledTimes(12);
  });
});

describe("useScheduleMonthsQuery — 하나라도 pending이면 로딩이다", () => {
  it("한 달은 응답하고 한 달은 안 끝나면 isLoading이 true다", async () => {
    getMonthScheduleMock.mockImplementation(async (_client, month) => {
      if (month === "2026-09") {
        return [dayFor(month as string)];
      }
      return new Promise(() => {});
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useScheduleMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(getMonthScheduleMock).toHaveBeenCalledTimes(2));

    expect(result.current.isLoading).toBe(true);
  });
});

describe("useScheduleMonthsQuery — 하나라도 error면 그 error가 표면에 뜬다", () => {
  it("한 달이 실패하면 error에 그 이유가 담긴다", async () => {
    const failure = new Error("month read failed");
    getMonthScheduleMock.mockImplementation(async (_client, month) => {
      if (month === "2026-10") {
        throw failure;
      }
      return [dayFor(month as string)];
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useScheduleMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe("month read failed");
  });
});

describe("useScheduleMonthsQuery — 전부 오면 달치가 합쳐져 나온다", () => {
  it("두 달의 날들이 하나의 배열로 이어진다", async () => {
    getMonthScheduleMock.mockImplementation(async (_client, month) => [
      dayFor(month as string),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useScheduleMonthsQuery(FAKE_CLIENT, ["2026-09", "2026-10"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.map((day) => day.id)).toEqual(
      expect.arrayContaining(["day-2026-09", "day-2026-10"]),
    );
  });
});
