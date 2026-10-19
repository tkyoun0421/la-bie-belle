import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import type { getMonthAttendance } from "@/entities/attendance/api/getMonthAttendance.api";
import type { getPayrollMonth } from "@/entities/payroll/api/getPayrollMonth.api";
import type { getMyProfile } from "@/entities/profile/api/getMyProfile.api";
import type { getProfilePrivate } from "@/entities/profile/api/profilePrivate.api";
import type { getMyRehearsals } from "@/entities/rehearsal/api/getMyRehearsals.api";
import type { getFirstScheduleMonth } from "@/entities/schedule/api/getFirstScheduleMonth.api";
import type { getMonthSchedule } from "@/entities/schedule/api/getMonthSchedule.api";
import type { getCurrentUser } from "@/entities/session/api/getCurrentUser.api";

const getCurrentUserMock = jest.fn<typeof getCurrentUser>();
const getMyProfileMock = jest.fn<typeof getMyProfile>();
const getProfilePrivateMock = jest.fn<typeof getProfilePrivate>();
const getMonthScheduleMock = jest.fn<typeof getMonthSchedule>();
const getMonthAttendanceMock = jest.fn<typeof getMonthAttendance>();
const getPayrollMonthMock = jest.fn<typeof getPayrollMonth>();
const getMyRehearsalsMock = jest.fn<typeof getMyRehearsals>();
const getFirstScheduleMonthMock = jest.fn<typeof getFirstScheduleMonth>();

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

jest.unstable_mockModule("@/entities/clock/hooks/useServerToday", () => ({
  useServerToday: () => TODAY,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useStatsScreen } = await import("@/screens/stats/hooks/useStatsScreen");
const { PAYROLL_PATH } = await import("@/shared/consts/navigation.const");

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

const BASE_PROFILE = {
  id: "me",
  displayName: null,
  photoUrl: null,
  role: "worker",
  submittedAt: null,
  approvedAt: null,
  rejectedAt: null,
  blockedAt: null,
  leftAt: null,
  notificationsEnabled: true,
};

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

  getCurrentUserMock.mockResolvedValue({
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-10-01T00:00:00.000Z",
  });
  getMyProfileMock.mockResolvedValue({
    ...BASE_PROFILE,
    id: "me",
    role: "worker",
    approvedAt: "2026-01-02T00:00:00.000Z",
    leftAt: null,
  });
  getProfilePrivateMock.mockResolvedValue({
    email: null,
    phone: "010-0000-0001",
    birthDate: null,
    gender: null,
  });
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

describe("useStatsScreen — 고른 탭이 읽는 것을 바꾼다", () => {
  it("조각에 심어 줄 내 profileId를 낸다", async () => {
    const { result } = await mounted();

    expect(result.current.profileId).toBe("me");
  });

  it("처음에는 근태 탭이고 이번 달이다", async () => {
    const { result } = await mounted();

    expect(result.current.tab).toBe("attendance");
    expect(result.current.month).toBe("2026-10");
    expect(result.current.selectedMonth).toBe(10);
  });

  it("근무한 날이 없으면 empty다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toEqual({ state: "empty" });
    expect(result.current.trendValueLabel).toBeUndefined();
  });

  it("근태 탭은 날짜 목록과 현황 줄과 비율 띠를 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.listState).toEqual({
        state: "ready",
        tab: "attendance",
      }),
    );

    expect(result.current.trendValueLabel).toContain("%");
  });

  it("포지션 탭으로 가면 근무표를 읽고 포지션 줄이 선다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    act(() => result.current.chooseTab("position"));

    await waitFor(() =>
      expect(result.current.listState).toEqual({
        state: "ready",
        tab: "position",
      }),
    );

    expect(result.current.trendValueLabel).toContain("시간");
  });

  it("급여 탭은 급여 자리를 세우고 보던 달을 구간으로 넘긴다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    act(() => result.current.chooseTab("payroll"));

    await waitFor(() =>
      expect(result.current.listState).toEqual({
        state: "ready",
        tab: "payroll",
      }),
    );

    expect(result.current.payrollSpan).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("탭을 옮겨도 보던 달이 그대로다", async () => {
    const { result } = await mounted();

    act(() => result.current.goPrev());

    expect(result.current.month).toBe("2026-09");

    act(() => result.current.chooseTab("position"));

    expect(result.current.month).toBe("2026-09");
  });

  it("추이 그래프가 열두 점을 낸다", async () => {
    const { result } = await mounted();

    expect(result.current.points).toHaveLength(12);
    expect(result.current.points[11].month).toBe(10);
  });

  it("읽기가 넘어지면 failed다", async () => {
    getMonthAttendanceMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.listState).toEqual({ state: "failed" }),
    );
  });

  it("다시 시도가 네 키를 다시 읽는다", async () => {
    getMonthAttendanceMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.listState).toEqual({ state: "failed" }),
    );

    getMonthAttendanceMock.mockResolvedValue(EMPTY_ATTENDANCE);

    act(() => result.current.retry());

    await waitFor(() =>
      expect(result.current.listState).toEqual({ state: "empty" }),
    );
  });
});

describe("useStatsScreen — 갈 데를 controller가 정한다", () => {
  it("뒤로는 쌓인 자리로 되돌아간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it("내역 보기는 급여 화면을 쌓는다", async () => {
    const { result } = await mounted();

    act(() => result.current.openPayrollHistory());

    expect(pushMock).toHaveBeenCalledWith(PAYROLL_PATH);
  });
});

function identityOf(controller: object) {
  return "identity" in controller ? controller.identity : undefined;
}

describe("useStatsScreen — 신분을 읽는 결과가 조각의 자리를 가른다", () => {
  function mountedUnsettled() {
    const { wrapper } = createWrapper();

    return renderHook(() => useStatsScreen(), { wrapper });
  }

  it("프로필을 읽는 중이면 신분은 pending이다", async () => {
    getMyProfileMock.mockReturnValue(new Promise(() => undefined));

    const { result } = mountedUnsettled();

    await waitFor(() => expect(getMyProfileMock).toHaveBeenCalled());

    expect(identityOf(result.current)).toEqual({ state: "pending" });
    expect(result.current.profileId).toBeNull();
  });

  it("프로필 읽기가 넘어지면 신분은 failed다", async () => {
    getMyProfileMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mountedUnsettled();

    await waitFor(() =>
      expect(identityOf(result.current)).toEqual({ state: "failed" }),
    );

    expect(result.current.profileId).toBeNull();
  });

  it("프로필 읽기가 넘어진 뒤 다시 시도하면 신분이 ready로 돌아온다", async () => {
    getMyProfileMock.mockRejectedValueOnce(new Error("끊겼다"));

    const { result } = mountedUnsettled();

    await waitFor(() =>
      expect(identityOf(result.current)).toEqual({ state: "failed" }),
    );

    act(() => result.current.retry());

    await waitFor(() =>
      expect(identityOf(result.current)).toEqual({
        state: "ready",
        profileId: "me",
      }),
    );
  });

  it("세션 읽기가 넘어진 뒤 다시 시도하면 신분이 ready로 돌아온다", async () => {
    getCurrentUserMock.mockRejectedValueOnce(new Error("끊겼다"));

    const { result } = mountedUnsettled();

    await waitFor(() =>
      expect(identityOf(result.current)).toEqual({ state: "failed" }),
    );

    act(() => result.current.retry());

    await waitFor(() =>
      expect(identityOf(result.current)).toEqual({
        state: "ready",
        profileId: "me",
      }),
    );
  });

  it("로그인은 됐는데 프로필 행이 없으면 신분은 absent다", async () => {
    getMyProfileMock.mockResolvedValue(null);

    const { result } = mountedUnsettled();

    await waitFor(() =>
      expect(identityOf(result.current)).toEqual({ state: "absent" }),
    );

    expect(result.current.profileId).toBeNull();
  });

  it("프로필이 오면 신분은 ready고 profileId를 든다", async () => {
    const { result } = mountedUnsettled();

    await waitFor(() =>
      expect(identityOf(result.current)).toEqual({
        state: "ready",
        profileId: "me",
      }),
    );

    expect(result.current.profileId).toBe("me");
  });
});
