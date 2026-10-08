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
const { useWorkMonthsQuery } =
  await import("@/entities/schedule/services/useWorkMonthsQuery");

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

function daysFor(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `day-${index}`,
    work_date: "2026-09-01",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    assignments: [],
  }));
}

const TWELVE_MONTHS = Array.from(
  { length: 12 },
  (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
);

beforeEach(() => {
  getMonthScheduleMock.mockReset();
});

describe("useWorkMonthsQuery — 달마다 getMonthSchedule만 부른다", () => {
  it("열두 달이면 getMonthSchedule이 정확히 12번이다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonthsQuery(FAKE_CLIENT, TWELVE_MONTHS),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthScheduleMock).toHaveBeenCalledTimes(12);
  });
});

describe("useWorkMonthsQuery — 결과가 달마다 구분돼 돌아온다(flatMap으로 뭉개지 않는다)", () => {
  it("한 달은 사흘치, 한 달은 빈 달이어도 data 길이가 달 수(2)와 같다", async () => {
    getMonthScheduleMock.mockImplementation(async (_client, month) =>
      month === "2026-08" ? daysFor(3) : daysFor(0),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonthsQuery(FAKE_CLIENT, ["2026-08", "2026-09"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      month: "2026-08",
      days: expect.arrayContaining([expect.anything()]),
    });
    expect(result.current.data?.[0]?.days).toHaveLength(3);
    expect(result.current.data?.[1]).toEqual({ month: "2026-09", days: [] });
  });
});

describe("useWorkMonthsQuery — 근무표 화면과 캐시를 나눈다", () => {
  it("달마다 ['schedule', 'YYYY-MM'] 자리에 값이 앉는다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useWorkMonthsQuery(FAKE_CLIENT, ["2026-08"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["schedule", "2026-08"])).toHaveLength(1);
  });
});
