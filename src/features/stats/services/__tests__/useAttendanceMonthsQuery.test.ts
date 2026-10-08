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

const getMonthAttendanceMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/attendance/api/getMonthAttendance.api",
  () => ({
    getMonthAttendance: getMonthAttendanceMock,
  }),
  { virtual: true },
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useAttendanceMonthsQuery } =
  await import("@/features/stats/services/useAttendanceMonthsQuery");

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
  getMonthAttendanceMock.mockReset();
});

describe("useAttendanceMonthsQuery — 근태 탭은 schedule 열둘과 attendance 열둘, 스물넷을 부른다", () => {
  it("열두 달이면 getMonthSchedule 12번, getMonthAttendance 12번이다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    getMonthAttendanceMock.mockImplementation(async () => ({
      checkIns: [],
      excuseStatuses: [],
    }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAttendanceMonthsQuery(FAKE_CLIENT, TWELVE_MONTHS),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getMonthScheduleMock).toHaveBeenCalledTimes(12);
    expect(getMonthAttendanceMock).toHaveBeenCalledTimes(12);
    expect(
      getMonthScheduleMock.mock.calls.length +
        getMonthAttendanceMock.mock.calls.length,
    ).toBe(24);
  });
});

describe("useAttendanceMonthsQuery — 결과가 달마다 구분돼 돌아온다", () => {
  it("달마다 attendance 값이 따로 붙고 서로 안 섞인다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    getMonthAttendanceMock.mockImplementation(async (_client, month) => ({
      checkIns: month === "2026-08" ? [{ id: "c1" }, { id: "c2" }] : [],
      excuseStatuses: [],
    }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAttendanceMonthsQuery(FAKE_CLIENT, ["2026-08", "2026-09"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.month).toBe("2026-08");
    expect(result.current.data?.[0]?.days).toHaveLength(1);
    expect(result.current.data?.[0]?.attendance.checkIns).toHaveLength(2);
    expect(result.current.data?.[1]?.month).toBe("2026-09");
    expect(result.current.data?.[1]?.attendance.checkIns).toHaveLength(0);
  });
});

describe("useAttendanceMonthsQuery — 한쪽만 와 있으면 로딩이다", () => {
  it("근태만 오고 근무가 안 오면 data가 undefined다", async () => {
    getMonthScheduleMock.mockImplementation(() => new Promise(() => {}));
    getMonthAttendanceMock.mockImplementation(async () => ({
      checkIns: [],
      excuseStatuses: [],
    }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAttendanceMonthsQuery(FAKE_CLIENT, ["2026-08"]),
      { wrapper },
    );

    await waitFor(() =>
      expect(getMonthAttendanceMock).toHaveBeenCalledTimes(1),
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });
});

describe("useAttendanceMonthsQuery — 어느 쪽 오류든 올려 보낸다", () => {
  it("근태 쪽이 실패하면 error가 그 오류다", async () => {
    getMonthScheduleMock.mockImplementation(async () => daysFor(1));
    getMonthAttendanceMock.mockRejectedValue(new Error("근태가 안 왔다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAttendanceMonthsQuery(FAKE_CLIENT, ["2026-08"]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe("근태가 안 왔다");
  });
});
