import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/screens/stats/hooks/useStatsScreen.ts
//
// 근무자가 자기 한 달을 숫자로 보는 화면의 controller다. `.tsx`가 `useState` 셋과
// `useEffect` 하나와 `useMemo` 일곱을 들고, 질의 다섯이 낸 것을 탭마다 다른 손으로 조립하고
// 있었다.
//
// **고른 탭이 읽는 것을 바꾼다.** 탭에 없는 쪽은 열두 달을 안 읽어서, 탭은 화면 꾸밈이
// 아니라 통신을 움직이는 값이다.
//
// **「지금」을 서버 시계에서 읽는다.** 근태 판정과 급여 판정이 둘 다 지금에 달려 있다.

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthAttendanceMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getPayrollMonthMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyRehearsalsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getFirstScheduleMonthMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

jest.unstable_mockModule("@/entities/session/api/getCurrentUser.api", () => ({
  getCurrentUser: getCurrentUserMock,
}));

jest.unstable_mockModule("@/entities/profile/api/getMyProfile.api", () => ({
  getMyProfile: getMyProfileMock,
}));

jest.unstable_mockModule("@/entities/profile/api/profilePrivate.api", () => ({
  getProfilePrivate: getProfilePrivateMock,
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

jest.unstable_mockModule("@/entities/payroll/api/getPayrollMonth.api", () => ({
  getPayrollMonth: getPayrollMonthMock,
}));

jest.unstable_mockModule(
  "@/entities/rehearsal/api/getMyRehearsals.api",
  () => ({ getMyRehearsals: getMyRehearsalsMock }),
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
const { useStatsScreen } = await import("@/screens/stats/hooks/useStatsScreen");

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

const EMPTY_PAYROLL = {
  wageRates: [],
  adjustments: [],
  excuseStatus: [],
  holidays: [],
};

const EMPTY_ATTENDANCE = { checkIns: [], excuseStatuses: [] };

/** 그 달 하루에 내 배정 하나가 선 근무표다 — 다섯 시간짜리 메인이다. */
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
        profile_id: "me",
        ended_at: null,
        profiles: null,
      },
    ],
    check_ins: [],
  };
}

beforeEach(() => {
  getCurrentUserMock.mockReset();
  getMyProfileMock.mockReset();
  getProfilePrivateMock.mockReset();
  getMonthScheduleMock.mockReset();
  getMonthAttendanceMock.mockReset();
  getPayrollMonthMock.mockReset();
  getMyRehearsalsMock.mockReset();
  getFirstScheduleMonthMock.mockReset();

  getCurrentUserMock.mockResolvedValue({ id: "user-1", user_metadata: {} });
  getMyProfileMock.mockResolvedValue({
    id: "me",
    role: "worker",
    approved_at: "2026-01-02T00:00:00.000Z",
    left_at: null,
  });
  getProfilePrivateMock.mockResolvedValue({ phone: "010-0000-0001" });
  getMonthScheduleMock.mockResolvedValue([]);
  getMonthAttendanceMock.mockResolvedValue(EMPTY_ATTENDANCE);
  getPayrollMonthMock.mockResolvedValue(EMPTY_PAYROLL);
  getMyRehearsalsMock.mockResolvedValue([]);
  getFirstScheduleMonthMock.mockResolvedValue("2026-01");
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useStatsScreen(FAKE_CLIENT), { wrapper });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useStatsScreen — 고른 탭이 읽는 것을 바꾼다", () => {
  it("처음에는 근태 탭이고 이번 달이다", async () => {
    const { result } = await mounted();

    expect(result.current.tab).toBe("attendance");
    expect(result.current.monthLabel).toContain("10월");
    expect(result.current.selectedMonth).toBe(10);
  });

  it("근무한 날이 없으면 empty다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("empty");
    expect(result.current.trendValueLabel).toBeUndefined();
  });

  it("근태 탭은 날짜 목록과 현황 줄과 비율 띠를 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("attendance"));

    expect(result.current.attendanceRows).toHaveLength(1);
    expect(result.current.attendanceRows[0].title).toBeTruthy();
    expect(result.current.attendanceLine).toBeTruthy();
    expect(result.current.shares).toHaveLength(4);
    expect(result.current.trendValueLabel).toContain("%");
  });

  it("포지션 탭으로 가면 근무표를 읽고 포지션 줄이 선다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    act(() => result.current.chooseTab("position"));

    await waitFor(() => expect(result.current.listState).toBe("position"));

    expect(result.current.positionRows).toHaveLength(1);
    expect(result.current.positionRows[0].title).toBe("메인");
    expect(result.current.totalLabel).toBeTruthy();
    expect(result.current.trendValueLabel).toBe(result.current.totalLabel);
  });

  it("급여 탭은 금액과 예상치 안내와 보조 줄을 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    act(() => result.current.chooseTab("payroll"));

    await waitFor(() => expect(result.current.listState).toBe("payroll"));

    expect(result.current.amountLabel).toBeTruthy();
    expect(result.current.estimateNote).toBeTruthy();
    expect(result.current.payrollSubtitle).toBeTruthy();
  });

  it("탭을 옮겨도 보던 달이 그대로다", async () => {
    const { result } = await mounted();

    act(() => result.current.goPrev());

    expect(result.current.monthLabel).toContain("9월");

    act(() => result.current.chooseTab("position"));

    expect(result.current.monthLabel).toContain("9월");
  });

  it("첫 근무표보다 앞으로는 못 가고 다음 달로도 못 간다", async () => {
    getFirstScheduleMonthMock.mockResolvedValue("2026-10");

    const { result } = await mounted();

    await waitFor(() => expect(result.current.canGoPrev).toBe(false));

    expect(result.current.canGoNext).toBe(false);
  });

  it("첫 근무표가 오래면 뒤로 갈 수 있다", async () => {
    const { result } = await mounted();

    await waitFor(() => expect(result.current.canGoPrev).toBe(true));
  });

  it("추이 그래프가 열두 점을 낸다", async () => {
    const { result } = await mounted();

    expect(result.current.points).toHaveLength(12);
    expect(result.current.points[11].month).toBe(10);
  });

  it("읽기가 넘어지면 failed다", async () => {
    getMonthAttendanceMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("failed"));
  });

  it("다시 시도가 네 키를 다시 읽는다", async () => {
    getMonthAttendanceMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("failed"));

    getMonthAttendanceMock.mockResolvedValue(EMPTY_ATTENDANCE);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.listState).toBe("empty"));
  });
});
