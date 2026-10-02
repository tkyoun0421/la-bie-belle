import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/screens/adminStats/hooks/useAdminStatsScreen.ts
//
// 관리자가 한 달을 숫자로 보는 화면의 controller다. `.tsx`가 `useState` 셋과 `useMemo`
// 넷을 들고, 탭마다 다른 손으로 조립하고 사람 시트의 글월까지 거기서 만들고 있었다.
//
// **고른 탭이 읽는 것을 바꾼다.** 탭에 없는 쪽은 열두 달을 안 읽는다.
//
// **시트 열림이 통신 결과에 매여 있다.** 누른 사람의 날 목록이 이번 달 근무표에서 갈려
// 나와서, 달을 옮기면 그 사람의 날이 달라진다 — 화면이 들 상태가 아니다.

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthAttendanceMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getFirstScheduleMonthMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

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

const FAKE_CLIENT = {} as never;

const EMPTY_ATTENDANCE = { checkIns: [], excuseStatuses: [] };

/** 그 달 하루에 배정 하나가 선 근무표다 — 다섯 시간짜리 메인이다. */
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
  const hook = renderHook(() => useAdminStatsScreen(FAKE_CLIENT), { wrapper });

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
