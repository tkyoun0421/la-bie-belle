import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getPayrollMonthMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyRehearsalsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const countUnreadMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

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

jest.unstable_mockModule("@/entities/payroll/api/getPayrollMonth.api", () => ({
  getPayrollMonth: getPayrollMonthMock,
}));

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({ getMonthSchedule: getMonthScheduleMock }),
);

jest.unstable_mockModule(
  "@/entities/rehearsal/api/getMyRehearsals.api",
  () => ({ getMyRehearsals: getMyRehearsalsMock }),
);

jest.unstable_mockModule(
  "@/entities/notification/api/countUnreadNotifications.api",
  () => ({ countUnreadNotifications: countUnreadMock }),
);

jest.unstable_mockModule("@/shared/lib/kstToday.lib", () => ({
  kstToday: () => TODAY,
}));

const FAKE_CLIENT = {} as never;

const PATHNAME = "/payroll";

const pushMock = jest.fn();
const replaceMock = jest.fn();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  usePathname: () => PATHNAME,
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { usePayrollScreen } =
  await import("@/screens/payroll/hooks/usePayrollScreen");
const { LEFT_PATH, NOTIFICATIONS_PATH } =
  await import("@/shared/consts/navigation.const");

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
  pushMock.mockClear();
  replaceMock.mockClear();
  getCurrentUserMock.mockReset();
  getMyProfileMock.mockReset();
  getProfilePrivateMock.mockReset();
  getPayrollMonthMock.mockReset();
  getMonthScheduleMock.mockReset();
  getMyRehearsalsMock.mockReset();
  countUnreadMock.mockReset();

  getCurrentUserMock.mockResolvedValue({ id: "user-1", user_metadata: {} });
  getMyProfileMock.mockResolvedValue({
    id: "me",
    role: "worker",
    approvedAt: "2026-01-02T00:00:00.000Z",
    leftAt: null,
  });
  getProfilePrivateMock.mockResolvedValue({ phone: "010-0000-0001" });
  getPayrollMonthMock.mockResolvedValue(EMPTY_PAYROLL);
  getMonthScheduleMock.mockResolvedValue([]);
  getMyRehearsalsMock.mockResolvedValue([]);
  countUnreadMock.mockResolvedValue(0);
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => usePayrollScreen(), { wrapper });

  await waitFor(() => expect(hook.result.current.loading).toBe(false));

  return hook;
}

describe("usePayrollScreen — 기간이 날짜 하나와 단위 둘로 산다", () => {
  it("처음에는 이번 달이다", async () => {
    const { result } = await mounted();

    expect(result.current.unit).toBe("month");
    expect(result.current.periodLabel).toContain("10월");
  });

  it("단위를 바꿔도 보던 날짜가 남는다", async () => {
    const { result } = await mounted();

    act(() => result.current.goPrev());

    expect(result.current.periodLabel).toContain("9월");

    act(() => result.current.chooseUnit("week"));
    act(() => result.current.chooseUnit("month"));

    expect(result.current.periodLabel).toContain("9월");
  });

  it("고른 단위가 읽는 달을 넓힌다", async () => {
    const { result } = await mounted();

    const monthsRead = getMonthScheduleMock.mock.calls.length;

    act(() => result.current.chooseUnit("year"));

    await waitFor(() =>
      expect(getMonthScheduleMock.mock.calls.length).toBeGreaterThan(
        monthsRead,
      ),
    );
  });

  it("승인 전으로는 못 간다", async () => {
    getMyProfileMock.mockResolvedValue({
      id: "me",
      role: "worker",
      approvedAt: `${TODAY}T00:00:00.000Z`,
      leftAt: null,
    });

    const { result } = await mounted();

    expect(result.current.canGoPrev).toBe(false);
    expect(result.current.canGoNext).toBe(false);
  });

  it("승인된 지 오래면 앞으로 갈 수 있다", async () => {
    const { result } = await mounted();

    expect(result.current.canGoPrev).toBe(true);
  });

  it("근무한 날이 없으면 empty다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("empty");
  });

  it("근무한 날이 있으면 history 자리가 선다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("history"));
  });

  it("조각에 넘기는 구간이 보고 있는 기간과 같다", async () => {
    const { result } = await mounted();

    expect(result.current.span).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });

    act(() => result.current.chooseUnit("year"));

    expect(result.current.span).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  it("연 단위에서는 months 자리가 서고 달을 받으면 그 달로 내려간다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    act(() => result.current.chooseUnit("year"));

    await waitFor(() => expect(result.current.listState).toBe("months"));

    act(() => result.current.openMonth("2026-10"));

    expect(result.current.unit).toBe("month");
    expect(result.current.periodLabel).toContain("10월");
  });

  it("읽기가 넘어지면 failed다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("failed"));
  });

  it("퇴사하면 종을 안 그리고 뒤로가 선다", async () => {
    getMyProfileMock.mockResolvedValue({
      id: "me",
      role: "worker",
      approvedAt: "2026-01-02T00:00:00.000Z",
      leftAt: "2026-09-30T00:00:00.000Z",
    });

    const { result } = await mounted();

    expect(result.current.hasLeft).toBe(true);
    expect(result.current.unread).toBe(false);
  });

  it("안 읽은 알림이 있으면 종에 점이 선다", async () => {
    countUnreadMock.mockResolvedValue(2);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.unread).toBe(true));
  });

  it("퇴사한 날 뒤로는 앞으로 못 간다", async () => {
    getMyProfileMock.mockResolvedValue({
      id: "me",
      role: "worker",
      approvedAt: "2026-01-02T00:00:00.000Z",
      leftAt: "2026-09-30T00:00:00.000Z",
    });

    const { result } = await mounted();

    expect(result.current.canGoNext).toBe(false);
  });

  it("다시 시도가 세 키를 다시 읽는다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("failed"));

    getMonthScheduleMock.mockResolvedValue([]);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.listState).toBe("empty"));
  });
});

describe("usePayrollScreen — 갈 데를 controller가 정한다", () => {
  it("종을 누르면 어디서 왔는지를 달고 알림으로 간다", async () => {
    const { result } = await mounted();

    expect(result.current.showBell).toBe(true);

    act(() => result.current.openNotifications());

    expect(pushMock).toHaveBeenCalledWith(
      `${NOTIFICATIONS_PATH}?from=${PATHNAME}`,
    );
  });

  it("안 퇴사했으면 뒤로가 없다", async () => {
    const { result } = await mounted();

    expect(result.current.goBack).toBeUndefined();
  });

  it("퇴사했으면 뒤로가 퇴사 화면으로 바꿔 넣고 종이 없다", async () => {
    getMyProfileMock.mockResolvedValue({
      id: "me",
      role: "worker",
      approvedAt: "2026-01-02T00:00:00.000Z",
      leftAt: "2026-09-30T00:00:00.000Z",
    });

    const { result } = await mounted();

    expect(result.current.showBell).toBe(false);

    act(() => result.current.goBack?.());

    expect(replaceMock).toHaveBeenCalledWith(LEFT_PATH);
  });
});
