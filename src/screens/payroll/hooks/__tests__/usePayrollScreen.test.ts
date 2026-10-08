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
  getPayrollMonthMock.mockReset();
  getMonthScheduleMock.mockReset();
  getMyRehearsalsMock.mockReset();
  countUnreadMock.mockReset();

  getCurrentUserMock.mockResolvedValue({ id: "user-1", user_metadata: {} });
  getMyProfileMock.mockResolvedValue({
    id: "me",
    role: "worker",
    approved_at: "2026-01-02T00:00:00.000Z",
    left_at: null,
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
      approved_at: `${TODAY}T00:00:00.000Z`,
      left_at: null,
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
    expect(result.current.amountLabel).toBeTruthy();
  });

  it("근무한 날이 있으면 history 줄이 선다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.listState).toBe("history"));

    expect(result.current.historyRows).toHaveLength(1);
    expect(result.current.historyRows[0].date).toBe("2026-10-02");
    expect(result.current.accrual.work).toBeTruthy();
  });

  it("연 단위에서는 달 줄이 서고 줄을 누르면 그 달로 내려간다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-02")]);

    const { result } = await mounted();

    act(() => result.current.chooseUnit("year"));

    await waitFor(() => expect(result.current.listState).toBe("months"));

    const monthRow = result.current.monthRows.find(
      (row) => row.type === "month",
    );
    expect(monthRow).toBeDefined();

    act(() => {
      if (monthRow?.type === "month") {
        result.current.openMonth(monthRow.month);
      }
    });

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
      approved_at: "2026-01-02T00:00:00.000Z",
      left_at: "2026-09-30T00:00:00.000Z",
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
      approved_at: "2026-01-02T00:00:00.000Z",
      left_at: "2026-09-30T00:00:00.000Z",
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
