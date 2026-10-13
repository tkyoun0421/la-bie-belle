import { jest } from "@jest/globals";
import type { ReactNode } from "react";

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

const FAKE_CLIENT = {} as never;

const backMock = jest.fn();
const pushMock = jest.fn();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({ back: backMock, push: pushMock }),
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

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

const chartValues = await import("@/screens/stats/utils/myChartValues.utils");

const attendanceValuesSpy = jest.fn(chartValues.myAttendanceValues);
const workValuesSpy = jest.fn(chartValues.myWorkValues);
const payrollValuesSpy = jest.fn(chartValues.myPayrollValues);

jest.unstable_mockModule("@/screens/stats/utils/myChartValues.utils", () => ({
  ...chartValues,
  myAttendanceValues: attendanceValuesSpy,
  myWorkValues: workValuesSpy,
  myPayrollValues: payrollValuesSpy,
}));

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

const EMPTY_PAYROLL = {
  wageRates: [],
  adjustments: [],
  excuseStatus: [],
  holidays: [],
};

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
        profileId: "me",
        endedAt: null,
        name: null,
      },
    ],
    checkIns: [],
  };
}

beforeEach(() => {
  backMock.mockClear();
  pushMock.mockClear();
  getCurrentUserMock.mockReset();
  getMyProfileMock.mockReset();
  getProfilePrivateMock.mockReset();
  getMonthScheduleMock.mockReset();
  getMonthAttendanceMock.mockReset();
  getPayrollMonthMock.mockReset();
  getMyRehearsalsMock.mockReset();
  getFirstScheduleMonthMock.mockReset();
  attendanceValuesSpy.mockClear();
  workValuesSpy.mockClear();
  payrollValuesSpy.mockClear();

  getCurrentUserMock.mockResolvedValue({ id: "user-1", user_metadata: {} });
  getMyProfileMock.mockResolvedValue({
    id: "me",
    role: "worker",
    approvedAt: "2026-01-02T00:00:00.000Z",
    leftAt: null,
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
  const hook = renderHook(() => useStatsScreen(), { wrapper });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toEqual({ state: "pending" }),
  );

  return hook;
}

describe("useStatsScreen — 고른 탭의 값만 만든다", () => {
  it("근태 탭에서는 포지션과 급여의 값 만들기를 부르지 않는다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    await mounted();

    expect(attendanceValuesSpy).toHaveBeenCalled();
    expect(workValuesSpy).not.toHaveBeenCalled();
    expect(payrollValuesSpy).not.toHaveBeenCalled();
  });

  it("포지션 탭에서는 근태와 급여의 값 만들기를 부르지 않는다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    attendanceValuesSpy.mockClear();
    workValuesSpy.mockClear();
    payrollValuesSpy.mockClear();

    act(() => result.current.chooseTab("position"));

    await waitFor(() =>
      expect(result.current.listState).toEqual({
        state: "ready",
        tab: "position",
      }),
    );

    expect(workValuesSpy).toHaveBeenCalled();
    expect(attendanceValuesSpy).not.toHaveBeenCalled();
    expect(payrollValuesSpy).not.toHaveBeenCalled();
  });

  it("급여 탭에서는 근태와 포지션의 값 만들기를 부르지 않는다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    attendanceValuesSpy.mockClear();
    workValuesSpy.mockClear();
    payrollValuesSpy.mockClear();

    act(() => result.current.chooseTab("payroll"));

    await waitFor(() =>
      expect(result.current.listState).toEqual({
        state: "ready",
        tab: "payroll",
      }),
    );

    expect(payrollValuesSpy).toHaveBeenCalled();
    expect(attendanceValuesSpy).not.toHaveBeenCalled();
    expect(workValuesSpy).not.toHaveBeenCalled();
  });

  it.each(["attendance", "position", "payroll"] as const)(
    "%s 탭은 다른 탭의 질의가 비어 있어도 점 열두 개를 낸다",
    async (tab) => {
      getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

      const { result } = await mounted();

      act(() => result.current.chooseTab(tab));

      await waitFor(() =>
        expect(result.current.listState).toEqual({ state: "ready", tab }),
      );

      expect(result.current.points).toHaveLength(12);
      expect(result.current.trendValueLabel).toEqual(expect.any(String));
    },
  );

  it("근무한 날이 없는 달에도 세 탭이 모두 터지지 않는다", async () => {
    const { result } = await mounted();

    for (const tab of ["position", "payroll", "attendance"] as const) {
      act(() => result.current.chooseTab(tab));

      await waitFor(() => expect(result.current.tab).toBe(tab));
      await waitFor(() =>
        expect(result.current.listState).not.toEqual({ state: "pending" }),
      );

      expect(result.current.points).toHaveLength(12);
    }
  });
});
