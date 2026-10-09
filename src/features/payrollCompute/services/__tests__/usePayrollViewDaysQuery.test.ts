import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getPayrollMonthMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyRehearsalsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/session/api/getCurrentUser.api", () => ({
  getCurrentUser: getCurrentUserMock,
}));

jest.unstable_mockModule("@/entities/profile/api/getMyProfile.api", () => ({
  getMyProfile: getMyProfileMock,
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

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { usePayrollViewDaysQuery } =
  await import("@/features/payrollCompute/services/usePayrollViewDaysQuery");

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
  getCurrentUserMock.mockReset();
  getMyProfileMock.mockReset();
  getPayrollMonthMock.mockReset();
  getMonthScheduleMock.mockReset();
  getMyRehearsalsMock.mockReset();

  getCurrentUserMock.mockResolvedValue({ id: "user-1", user_metadata: {} });
  getMyProfileMock.mockResolvedValue({
    id: "me",
    role: "worker",
    approvedAt: "2026-01-02T00:00:00.000Z",
    leftAt: null,
  });
  getPayrollMonthMock.mockResolvedValue(EMPTY_PAYROLL);
  getMonthScheduleMock.mockResolvedValue([]);
  getMyRehearsalsMock.mockResolvedValue([]);
});

const OCTOBER = { from: "2026-10-01", to: "2026-10-31" };

async function mounted(span: { from: string; to: string } = OCTOBER) {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => usePayrollViewDaysQuery(FAKE_CLIENT, span), {
    wrapper,
  });

  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));

  return hook;
}

describe("usePayrollViewDaysQuery — 네 도메인을 맞춰 급여 날을 낸다", () => {
  it("구간이 걸친 달마다 세 질의를 부른다", async () => {
    await mounted({ from: "2026-09-28", to: "2026-10-04" });

    expect(getPayrollMonthMock).toHaveBeenCalledTimes(2);
    expect(getMonthScheduleMock).toHaveBeenCalledTimes(2);
    expect(getMyRehearsalsMock).toHaveBeenCalledTimes(2);
  });

  it("내가 붙은 날이 급여 날로 선다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-09")]);

    const { result } = await mounted();

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].date).toBe("2026-10-09");
    expect(result.current.data?.[0].position).toBe("메인");
  });

  it("구간 밖의 날은 걸러진다", async () => {
    getMonthScheduleMock.mockResolvedValue([
      scheduleDay("2026-10-03"),
      scheduleDay("2026-10-09"),
    ]);

    const { result } = await mounted({ from: "2026-10-05", to: "2026-10-11" });

    expect(result.current.data?.map((day) => day.date)).toEqual(["2026-10-09"]);
  });

  it("시급이 없으면 금액이 0이고 wage-pending이다", async () => {
    getMonthScheduleMock.mockResolvedValue([scheduleDay("2026-10-09")]);

    const { result } = await mounted();

    expect(result.current.data?.[0].kind).toBe("wage-pending");
    expect(result.current.data?.[0].amount).toBe(0);
  });
});

describe("usePayrollViewDaysQuery — 다 오기 전에는 값을 안 낸다", () => {
  it("읽는 중에는 data가 undefined고 isLoading이다", () => {
    getMonthScheduleMock.mockImplementation(() => new Promise(() => {}));

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => usePayrollViewDaysQuery(FAKE_CLIENT, OCTOBER),
      { wrapper },
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });
});

describe("usePayrollViewDaysQuery — 어느 쪽 오류든 올려 보낸다", () => {
  it("급여 쪽이 넘어지면 error가 그 오류다", async () => {
    getPayrollMonthMock.mockRejectedValue(new Error("급여가 안 왔다"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => usePayrollViewDaysQuery(FAKE_CLIENT, OCTOBER),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe("급여가 안 왔다");
    expect(result.current.data).toBeUndefined();
  });

  it("근무 쪽이 넘어져도 error가 선다", async () => {
    getMonthScheduleMock.mockRejectedValue(new Error("근무가 안 왔다"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => usePayrollViewDaysQuery(FAKE_CLIENT, OCTOBER),
      { wrapper },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe("근무가 안 왔다");
  });
});

describe("usePayrollViewDaysQuery — 다시 시도할 손을 내준다", () => {
  it("refetch를 부르면 세 질의를 다시 읽는다", async () => {
    const { result } = await mounted();

    expect(getPayrollMonthMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(getPayrollMonthMock).toHaveBeenCalledTimes(2));

    expect(getMonthScheduleMock).toHaveBeenCalledTimes(2);
    expect(getMyRehearsalsMock).toHaveBeenCalledTimes(2);
  });
});
