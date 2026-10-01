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
const { useMonthScheduleQuery } =
  await import("@/entities/schedule/services/useMonthScheduleQuery");

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

const MONTH = "2026-10";

const MONTH_ROW = [
  {
    id: "day-1",
    work_date: "2026-10-10",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    slots: [
      {
        id: "slot-1",
        positions: ["팀장"],
        ended_at: null,
      },
    ],
    assignments: [
      {
        id: "assignment-1",
        position: "팀장",
        kind: "regular",
        profile_id: "profile-1",
        ended_at: null,
        profiles: { display_name: "김지수" },
      },
    ],
  },
];

beforeEach(() => {
  getMonthScheduleMock.mockReset();
});

describe("useMonthScheduleQuery — getMonthSchedule를 그 달로 불러 ['schedule', month]에 앉힌다", () => {
  it("client와 month를 그대로 넘겨 DAL을 부른다", async () => {
    getMonthScheduleMock.mockResolvedValue(MONTH_ROW);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthScheduleQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthScheduleMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
  });

  it("아직 응답이 없으면 isLoading이 참이다", () => {
    getMonthScheduleMock.mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthScheduleQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("응답하면 근무표를 그대로 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue(MONTH_ROW);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthScheduleQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(MONTH_ROW);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMonthScheduleQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['schedule', month]다", async () => {
    getMonthScheduleMock.mockResolvedValue(MONTH_ROW);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useMonthScheduleQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["schedule", MONTH])).toEqual(MONTH_ROW);
  });

  it("달이 바뀌면 다른 캐시 키로 다시 부른다", async () => {
    getMonthScheduleMock.mockResolvedValue(MONTH_ROW);
    const { wrapper, queryClient } = createWrapper();

    const { rerender } = renderHook(
      ({ month }: { month: string }) =>
        useMonthScheduleQuery(FAKE_CLIENT, month),
      { wrapper, initialProps: { month: MONTH } },
    );

    await waitFor(() =>
      expect(queryClient.getQueryData(["schedule", MONTH])).toEqual(MONTH_ROW),
    );

    rerender({ month: "2026-11" });

    await waitFor(() =>
      expect(getMonthScheduleMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-11"),
    );
  });
});
