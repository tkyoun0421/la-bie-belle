import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthAttendanceMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getFirstScheduleMonthMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
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

jest.unstable_mockModule(
  "@/entities/schedule/api/getFirstScheduleMonth.api",
  () => ({ getFirstScheduleMonth: getFirstScheduleMonthMock }),
);

jest.unstable_mockModule("@/shared/lib/kstToday.lib", () => ({
  kstToday: () => TODAY,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useAdminStatsScreen } =
  await import("@/screens/adminStats/hooks/useAdminStatsScreen");

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
    work_date: workDate,
    starts_at: "18:00:00",
    ends_at: "23:00:00",
    opened_at: `${workDate}T00:00:00.000Z`,
    slots: [],
    assignments: [
      {
        id: `assign-${workDate}`,
        slot_id: null,
        position: "메인",
        kind: "regular",
        profile_id: "p1",
        ended_at: null,
        profiles: { display_name: "이준호", photo_url: null },
      },
    ],
    check_ins: [],
  };
}

beforeEach(() => {
  getMonthScheduleMock.mockReset();
  getMonthAttendanceMock.mockReset();
  getFirstScheduleMonthMock.mockReset();

  getMonthScheduleMock.mockResolvedValue([]);
  getMonthAttendanceMock.mockResolvedValue(EMPTY_ATTENDANCE);
  getFirstScheduleMonthMock.mockResolvedValue("2026-01");
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useAdminStatsScreen(), { wrapper });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useAdminStatsScreen — 고른 탭이 읽는 것을 바꾼다", () => {
  it("처음에는 근무 탭이고 이번 달이다", async () => {
    const { result } = await mounted();

    expect(result.current.tab).toBe("work");
    expect(result.current.monthLabel).toContain("10월");
    expect(result.current.selectedMonth).toBe(10);
  });

  it("근무표가 없으면 empty다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("empty");
    expect(result.current.trendValueLabel).toBeUndefined();
  });

  it("근무 탭은 사람별과 포지션별 줄을 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("work"));

    expect(result.current.totalLabel).toBeTruthy();
    expect(result.current.countLine).toContain("1");
    expect(result.current.peopleRows).toHaveLength(1);
    expect(result.current.peopleRows[0].displayName).toBe("이준호");
    expect(result.current.positionRows.length).toBeGreaterThan(0);
    expect(result.current.trendValueLabel).toBe(result.current.totalLabel);
  });

  it("근태 탭은 현황 줄과 비율 띠와 사람별 줄을 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);
    getMonthAttendanceMock.mockResolvedValue({
      checkIns: [
        {
          id: "c1",
          day_id: "day-2026-10-02",
          profile_id: "p1",
          checked_at: "2026-10-02T09:00:00.000Z",
          reported_at: "2026-10-02T09:00:00.000Z",
          received_at: "2026-10-02T09:00:00.000Z",
          method: "qr",
        },
      ],
      excuseStatuses: [],
    });

    const { result } = await mounted();

    act(() => result.current.chooseTab("attendance"));

    await waitFor(() => expect(result.current.listState).toBe("attendance"));

    expect(result.current.attendanceLine).toBeTruthy();
    expect(result.current.shares).toHaveLength(4);
    expect(result.current.attendanceRows).toHaveLength(1);
    expect(result.current.trendValueLabel).toContain("%");
  });

  it("사람 줄을 누르면 그 사람의 날 목록이 시트에 선다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.peopleRows).toHaveLength(1));

    act(() => result.current.peopleRows[0].press());

    expect(result.current.sheet?.name).toBe("이준호");
    expect(result.current.sheet?.rows).toHaveLength(1);
    expect(result.current.sheet?.total).toContain("1");

    act(() => result.current.closeSheet());

    expect(result.current.sheet).toBeNull();
  });

  it("탭을 옮겨도 보던 달이 그대로다", async () => {
    const { result } = await mounted();

    act(() => result.current.goPrev());

    expect(result.current.monthLabel).toContain("9월");

    act(() => result.current.chooseTab("attendance"));

    expect(result.current.monthLabel).toContain("9월");
  });

  it("첫 근무표보다 앞으로는 못 가고 다음 달로도 못 간다", async () => {
    getFirstScheduleMonthMock.mockResolvedValue("2026-10");

    const { result } = await mounted();

    await waitFor(() => expect(result.current.canGoPrev).toBe(false));

    expect(result.current.canGoNext).toBe(false);
  });

  it("추이 그래프가 열두 점을 낸다", async () => {
    const { result } = await mounted();

    expect(result.current.points).toHaveLength(12);
    expect(result.current.points[11].month).toBe(10);
  });

  it("읽기가 넘어지면 failed다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("failed"));
  });

  it("다시 시도가 두 키를 다시 읽는다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("failed"));

    getMonthScheduleMock.mockResolvedValue([]);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.listState).toBe("empty"));
  });
});
