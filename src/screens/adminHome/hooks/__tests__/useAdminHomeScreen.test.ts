import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthWindowMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getOpenSlotsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getHallDefaultsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setHallDefaultsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listPendingMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getPendingApprovalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const countUnreadMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const TODAY = "2026-10-03";

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthSchedule: getMonthScheduleMock,
    getMonthWindow: getMonthWindowMock,
    liveAssignmentCount: (day: {
      assignments: { ended_at: string | null }[];
    }) => day.assignments.filter((one) => one.ended_at === null).length,
  }),
);

jest.unstable_mockModule("@/entities/schedule/api/getOpenSlots.api", () => ({
  getOpenSlots: getOpenSlotsMock,
}));

jest.unstable_mockModule("@/entities/hall/api/getHallDefaults.api", () => ({
  getHallDefaults: getHallDefaultsMock,
}));

jest.unstable_mockModule(
  "@/features/hallDefaults/api/setHallDefaults.api",
  () => ({ setHallDefaults: setHallDefaultsMock }),
);

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
  default_slots: 4,
  default_starts: "10:00:00",
  default_ends: "19:00:00",
};

function todayDay() {
  return {
    id: "day-today",
    work_date: TODAY,
    starts_at: "10:00:00",
    ends_at: "19:00:00",
    opened_at: `${TODAY}T00:00:00.000Z`,
    slots: [],
    assignments: [
      {
        id: "a1",
        slot_id: null,
        position: "메인",
        kind: "regular",
        profile_id: "p1",
        ended_at: null,
        profiles: null,
      },
      {
        id: "a2",
        slot_id: null,
        position: "서브",
        kind: "regular",
        profile_id: "p2",
        ended_at: null,
        profiles: null,
      },
    ],
    check_ins: [{ id: "c1", profile_id: "p1", checked_in_at: null }],
  };
}

const NOON_OF_TODAY = Date.parse(`${TODAY}T03:00:00.000Z`);

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(NOON_OF_TODAY);

  getMonthScheduleMock.mockReset();
  getMonthWindowMock.mockReset();
  getOpenSlotsMock.mockReset();
  getHallDefaultsMock.mockReset();
  setHallDefaultsMock.mockReset();
  listPendingMembersMock.mockReset();
  getPendingApprovalsMock.mockReset();
  countUnreadMock.mockReset();

  getMonthScheduleMock.mockResolvedValue([]);
  getMonthWindowMock.mockResolvedValue({ month: "2026-10", confirmedAt: null });
  getOpenSlotsMock.mockResolvedValue([]);
  getHallDefaultsMock.mockResolvedValue(DEFAULTS);
  setHallDefaultsMock.mockResolvedValue(undefined);
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
      { id: "s1", work_date: "2026-10-04", position: "메인" },
    ]);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    expect(result.current.cards[0].workDate).toBe("2026-10-04");
    expect(result.current.cards[0].title).toBeTruthy();
    expect(result.current.cards[0].daysLeftLine).toBeTruthy();
  });

  it("확정 전이면 빈 자리 카드가 없다", async () => {
    getOpenSlotsMock.mockResolvedValue([
      { id: "s1", work_date: "2026-10-04", position: "메인" },
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

  it("고친 값을 보내면 자리 수는 그대로 간다", async () => {
    const { result } = await mounted();

    act(() => result.current.openSheet());
    act(() => result.current.writeStarts("11:00"));
    act(() => result.current.writeEnds("20:00"));

    expect(result.current.sheet?.starts).toBe("11:00");

    act(() => result.current.saveDefaults());

    await waitFor(() =>
      expect(setHallDefaultsMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        slots: 4,
        starts: "11:00",
        ends: "20:00",
      }),
    );

    await waitFor(() => expect(result.current.sheet).toBeNull());
  });

  it("보내기가 넘어지면 시트가 열린 채로 적은 값이 남는다", async () => {
    setHallDefaultsMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.openSheet());
    act(() => result.current.writeStarts("11:00"));
    act(() => result.current.saveDefaults());

    await waitFor(() => expect(result.current.saveFailed).toBe(true));

    expect(result.current.sheet?.starts).toBe("11:00");
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
