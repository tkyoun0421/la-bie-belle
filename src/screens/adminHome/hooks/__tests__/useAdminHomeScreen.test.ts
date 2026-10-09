import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthWindowMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getOpenSlotsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getHallDefaultsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listPendingMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getPendingApprovalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const countUnreadMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

const FAKE_CLIENT = {} as never;

const pushMock = jest.fn();

const PATHNAME = "/admin";

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => PATHNAME,
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthSchedule: getMonthScheduleMock,
    getMonthWindow: getMonthWindowMock,
    liveAssignmentCount: (day: { assignments: { endedAt: string | null }[] }) =>
      day.assignments.filter((one) => one.endedAt === null).length,
  }),
);

jest.unstable_mockModule("@/entities/schedule/api/getOpenSlots.api", () => ({
  getOpenSlots: getOpenSlotsMock,
}));

jest.unstable_mockModule("@/entities/hall/api/getHallDefaults.api", () => ({
  getHallDefaults: getHallDefaultsMock,
}));

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: jest.fn(),
  listBlockedMembers: jest.fn(),
  listLeftMembers: jest.fn(),
  listPendingMembers: listPendingMembersMock,
}));

jest.unstable_mockModule(
  "@/entities/workRequest/api/getPendingApprovals.api",
  () => ({ getPendingApprovals: getPendingApprovalsMock }),
);

jest.unstable_mockModule(
  "@/entities/notification/api/countUnreadNotifications.api",
  () => ({ countUnreadNotifications: countUnreadMock }),
);

jest.unstable_mockModule("@/shared/lib/kstToday.lib", () => ({
  kstToday: () => TODAY,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useAdminHomeScreen } =
  await import("@/screens/adminHome/hooks/useAdminHomeScreen");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

const DEFAULTS = {
  slots: 4,
  starts: "10:00:00",
  ends: "19:00:00",
};

function todayDay() {
  return {
    id: "day-today",
    workDate: TODAY,
    startsAt: "10:00:00",
    endsAt: "19:00:00",
    openedAt: `${TODAY}T00:00:00.000Z`,
    slots: [],
    assignments: [
      {
        id: "a1",
        slotId: null,
        position: "메인",
        kind: "regular",
        profileId: "p1",
        endedAt: null,
        name: null,
      },
      {
        id: "a2",
        slotId: null,
        position: "서브",
        kind: "regular",
        profileId: "p2",
        endedAt: null,
        name: null,
      },
    ],
    checkIns: [{ id: "c1", profileId: "p1", checkedAt: null }],
  };
}

const NOON_OF_TODAY = Date.parse(`${TODAY}T03:00:00.000Z`);

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(NOON_OF_TODAY);

  pushMock.mockClear();
  getMonthScheduleMock.mockReset();
  getMonthWindowMock.mockReset();
  getOpenSlotsMock.mockReset();
  getHallDefaultsMock.mockReset();
  listPendingMembersMock.mockReset();
  getPendingApprovalsMock.mockReset();
  countUnreadMock.mockReset();

  getMonthScheduleMock.mockResolvedValue([]);
  getMonthWindowMock.mockResolvedValue({ month: "2026-10", confirmedAt: null });
  getOpenSlotsMock.mockResolvedValue([]);
  getHallDefaultsMock.mockResolvedValue(DEFAULTS);
  listPendingMembersMock.mockResolvedValue([]);
  getPendingApprovalsMock.mockResolvedValue([]);
  countUnreadMock.mockResolvedValue(0);
});

async function mounted() {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useAdminHomeScreen(), { wrapper });

  await waitFor(() => expect(hook.result.current.defaultsValue).toBeDefined());

  return hook;
}

describe("useAdminHomeScreen — 보는 것이 먼저고 하는 것이 뒤다", () => {
  it("오늘 배정이 없으면 오늘 현황이 통째로 없다", async () => {
    const { result } = await mounted();

    expect(result.current.status.kind).toBe("none");
    expect(result.current.cards).toEqual([]);
  });

  it("확정된 달의 오늘은 배정 수와 안 찍은 수를 말한다", async () => {
    getMonthWindowMock.mockResolvedValue({
      month: "2026-10",
      confirmedAt: `${TODAY}T00:00:00.000Z`,
    });
    getMonthScheduleMock.mockResolvedValue([todayDay()]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.status.kind).toBe("value"));

    if (result.current.status.kind !== "value") {
      throw new Error("확정된 오늘이 와야 한다");
    }

    expect(result.current.status.assignedCount).toBe(2);
    expect(result.current.status.notCheckedInCount).toBe(1);
    expect(result.current.todayLabel).toBeTruthy();
    expect(result.current.bandShares.map((share) => share.value)).toEqual([
      1, 0, 0, 1,
    ]);
  });

  it("오늘이 든 달이 확정되면 타일이 다음 달을 말한다", async () => {
    getMonthWindowMock.mockImplementation((_client, month) =>
      Promise.resolve(
        month === "2026-10"
          ? { month, confirmedAt: `${TODAY}T00:00:00.000Z` }
          : null,
      ),
    );

    const { result } = await mounted();

    await waitFor(() => expect(result.current.tileMonth).toBe("2026-11"));

    expect(result.current.summary).toBeTruthy();
  });

  it("확정된 달의 빈 자리는 카드가 되고 남은 날이 선다", async () => {
    getMonthWindowMock.mockResolvedValue({
      month: "2026-10",
      confirmedAt: `${TODAY}T00:00:00.000Z`,
    });
    getOpenSlotsMock.mockResolvedValue([
      { id: "s1", workDate: "2026-10-04", position: "메인" },
    ]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    expect(result.current.cards[0].workDate).toBe("2026-10-04");
    expect(result.current.cards[0].title).toBeTruthy();
    expect(result.current.cards[0].daysLeftLine).toBeTruthy();
  });

  it("확정 전이면 빈 자리 카드가 없다", async () => {
    getOpenSlotsMock.mockResolvedValue([
      { id: "s1", workDate: "2026-10-04", position: "메인" },
    ]);

    const { result } = await mounted();

    expect(result.current.cards).toEqual([]);
  });

  it("미니뷰가 오늘이 든 달과 그 달의 밀도를 낸다", async () => {
    getMonthScheduleMock.mockResolvedValue([todayDay()]);

    const { result } = await mounted();

    await waitFor(() =>
      expect(Object.keys(result.current.loads)).toHaveLength(1),
    );

    expect(result.current.miniYear).toBe(2026);
    expect(result.current.miniMonth).toBe(10);
    expect(result.current.monthLabel).toBe("10월");
  });

  it("기본값 줄이 분까지만 적힌 시각을 낸다", async () => {
    const { result } = await mounted();

    expect(result.current.defaultsValue).toBe("10:00–19:00");
  });

  it("시트를 열면 지금 기본값이 칸에 채워진다", async () => {
    const { result } = await mounted();

    act(() => result.current.openSheet());

    expect(result.current.sheet).toEqual({
      starts: "10:00",
      ends: "19:00",
    });
  });

  it("시트가 쓸 자리 수를 같이 낸다", async () => {
    const { result } = await mounted();

    expect(result.current.slots).toBe(DEFAULTS.slots);
  });

  it("승인할 일과 가입 대기가 셈을 글월에 담는다", async () => {
    getPendingApprovalsMock.mockResolvedValue([{ id: "r1" }, { id: "r2" }]);
    listPendingMembersMock.mockResolvedValue([{ id: "m1" }]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.approvalsTitle).toContain("2"));

    expect(result.current.pendingValue).toBe("1명");
  });

  it("안 읽은 알림이 있으면 종에 점이 선다", async () => {
    countUnreadMock.mockResolvedValue(3);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.unread).toBe(true));
  });
});

describe("useAdminHomeScreen — 갈 데를 controller가 정한다", () => {
  it("오늘 현황은 오늘 날짜를 달고 근무표로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goToday());

    expect(pushMock).toHaveBeenCalledWith(`/admin/schedule?date=${TODAY}`);
  });

  it("근무표 타일은 타일이 보는 달을 달고 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goTileMonth());

    expect(pushMock).toHaveBeenCalledWith("/admin/schedule?month=2026-10");
  });

  it("미니뷰는 오늘이 든 달을 달고 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goMonth());

    expect(pushMock).toHaveBeenCalledWith("/admin/schedule?month=2026-10");
  });

  it("빈 자리 카드는 그 날을 달고 간다", async () => {
    getMonthWindowMock.mockResolvedValue({
      month: "2026-10",
      confirmedAt: `${TODAY}T00:00:00.000Z`,
    });
    getOpenSlotsMock.mockResolvedValue([
      { id: "s1", workDate: "2026-10-04", position: "메인" },
    ]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    act(() => result.current.cards[0].press());

    expect(pushMock).toHaveBeenCalledWith("/admin/schedule?date=2026-10-04");
  });

  it("종은 어디서 왔는지를 달고 알림으로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goNotifications());

    expect(pushMock).toHaveBeenCalledWith(`/notifications?from=${PATHNAME}`);
  });

  it("관리자 스위치는 근무자 홈으로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goWorkerHome());

    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("아래 줄들이 각자 제 자리로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goApprovals());
    act(() => result.current.goPending());
    act(() => result.current.goMembers());
    act(() => result.current.goWages());
    act(() => result.current.goQr());
    act(() => result.current.goStats());

    expect(pushMock.mock.calls.map(([to]) => to)).toEqual([
      "/admin/approvals",
      "/admin/members/pending",
      "/admin/members",
      "/admin/wages",
      "/admin/qr",
      "/admin/stats",
    ]);
  });
});
