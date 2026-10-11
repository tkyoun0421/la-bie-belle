import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthAttendanceMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const MONTH = "2026-10";

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthSchedule: getMonthScheduleMock,
    getMonthWindow: jest.fn(),
    liveAssignmentCount: () => 0,
  }),
);

jest.unstable_mockModule(
  "@/entities/attendance/api/getMonthAttendance.api",
  () => ({ getMonthAttendance: getMonthAttendanceMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useAdminStatsAttendance } =
  await import("@/features/stats/hooks/useAdminStatsAttendance");

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

const EMPTY_ATTENDANCE = { checkIns: [], excuseStatuses: [] };

function scheduleDay(workDate: string) {
  return {
    id: `day-${workDate}`,
    workDate,
    startsAt: "18:00:00",
    endsAt: "23:00:00",
    openedAt: `${workDate}T00:00:00.000Z`,
    slots: [],
    assignments: [
      {
        id: `assign-${workDate}`,
        slotId: null,
        position: "메인",
        kind: "regular",
        profileId: "p1",
        endedAt: null,
        name: "이준호",
      },
    ],
    checkIns: [],
  };
}

beforeEach(() => {
  getMonthScheduleMock.mockReset();
  getMonthAttendanceMock.mockReset();

  getMonthScheduleMock.mockResolvedValue([]);
  getMonthAttendanceMock.mockResolvedValue(EMPTY_ATTENDANCE);
});

function mounted() {
  const { wrapper } = createWrapper();

  return renderHook(() => useAdminStatsAttendance(MONTH), { wrapper });
}

describe("useAdminStatsAttendance — 조각이 그 달의 근태를 읽는다", () => {
  it("기다리는 중은 상태 이름으로 낸다", () => {
    const { result } = mounted();

    expect(result.current.state).toBe("pending");
  });

  it("근무표가 없으면 empty다", async () => {
    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("empty"));
  });

  it("현황 줄과 비율 띠와 사람별 줄을 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("ready"));

    if (result.current.state !== "ready") {
      throw new Error("ready가 아니다");
    }

    expect(result.current.line).toBeTruthy();
    expect(result.current.shares).toHaveLength(4);
    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].displayName).toBe("이준호");
    expect(result.current.rows[0].value).toBeTruthy();
  });

  it("읽기가 넘어지면 failed다", async () => {
    getMonthAttendanceMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    await waitFor(() => expect(result.current.state).toBe("failed"));
  });

  it("재시도 중에도 값이 이미 있으면 pending으로 돌아가지 않는다", async () => {
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

    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    let resolveRefetch: (value: unknown) => void = () => {};

    getMonthAttendanceMock
      .mockResolvedValueOnce(EMPTY_ATTENDANCE)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefetch = resolve;
          }),
      );

    const { result } = renderHook(() => useAdminStatsAttendance(MONTH), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe("ready"));

    act(() => {
      void queryClient.refetchQueries();
    });

    await waitFor(() =>
      expect(getMonthAttendanceMock).toHaveBeenCalledTimes(2),
    );

    expect(result.current.state).toBe("ready");

    resolveRefetch(EMPTY_ATTENDANCE);

    await waitFor(() => expect(result.current.state).toBe("ready"));
  });
});
