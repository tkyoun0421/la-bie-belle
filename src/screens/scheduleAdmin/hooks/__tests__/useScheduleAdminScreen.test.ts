import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthWindowMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getOpenSlotsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthAvailabilitiesMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const listActiveMembersMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getQualificationsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getSlotRequestsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getPayrollMonthMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getAllRehearsalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const createScheduleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setApplicationDeadlineMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const openDayMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const closeDayMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setDayHoursMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const confirmScheduleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const addAssignmentMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const grantPositionMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setAdjustmentMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FIXED_NOW_MS = Date.parse("2026-10-05T03:00:00.000Z");

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

jest.unstable_mockModule(
  "@/entities/availability/api/getMonthAvailabilities.api",
  () => ({ getMonthAvailabilities: getMonthAvailabilitiesMock }),
);

jest.unstable_mockModule("@/entities/member/api/listMembers.api", () => ({
  listActiveMembers: listActiveMembersMock,
  listBlockedMembers: jest.fn(),
  listLeftMembers: jest.fn(),
  listPendingMembers: jest.fn(),
}));

jest.unstable_mockModule("@/entities/member/api/getQualifications.api", () => ({
  getQualifications: getQualificationsMock,
}));

jest.unstable_mockModule(
  "@/entities/workRequest/api/getSlotRequests.api",
  () => ({ getSlotRequests: getSlotRequestsMock }),
);

jest.unstable_mockModule("@/entities/payroll/api/getPayrollMonth.api", () => ({
  getPayrollMonth: getPayrollMonthMock,
}));

jest.unstable_mockModule(
  "@/entities/rehearsal/api/getAllRehearsals.api",
  () => ({ getAllRehearsals: getAllRehearsalsMock }),
);

jest.unstable_mockModule(
  "@/features/scheduleDay/api/createSchedule.api",
  () => ({
    createSchedule: createScheduleMock,
  }),
);

jest.unstable_mockModule(
  "@/features/availabilitySubmit/api/setApplicationDeadline.api",
  () => ({ setApplicationDeadline: setApplicationDeadlineMock }),
);

jest.unstable_mockModule("@/features/scheduleDay/api/openDay.api", () => ({
  openDay: openDayMock,
}));

jest.unstable_mockModule("@/features/scheduleDay/api/closeDay.api", () => ({
  closeDay: closeDayMock,
}));

jest.unstable_mockModule("@/features/scheduleDay/api/setDayHours.api", () => ({
  setDayHours: setDayHoursMock,
}));

jest.unstable_mockModule(
  "@/features/scheduleConfirm/api/confirmSchedule.api",
  () => ({ confirmSchedule: confirmScheduleMock }),
);

jest.unstable_mockModule(
  "@/features/scheduleAssign/api/addAssignment.api",
  () => ({ addAssignment: addAssignmentMock }),
);

jest.unstable_mockModule(
  "@/features/qualificationGrant/api/grantPosition.api",
  () => ({ grantPosition: grantPositionMock }),
);

jest.unstable_mockModule("@/features/adjustment/api/setAdjustment.api", () => ({
  setAdjustment: setAdjustmentMock,
}));

const clockPolicy = await import("@/entities/clock/model/serverClock.policy");

jest.unstable_mockModule("@/entities/clock/model/serverClock.policy", () => ({
  ...clockPolicy,
  nowWithOffset: () => FIXED_NOW_MS,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { SCHEDULE_ADMIN_COPY } =
  await import("@/screens/scheduleAdmin/consts/scheduleAdmin.const");
const { useScheduleAdminScreen } =
  await import("@/screens/scheduleAdmin/hooks/useScheduleAdminScreen");

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

const WINDOW_OPEN = {
  month: "2026-10",
  applicationDeadline: "2026-10-10",
  confirmedAt: null,
};

const DAY = {
  id: "d1",
  work_date: "2026-10-10",
  starts_at: "10:00:00",
  ends_at: "18:00:00",
  opened_at: "2026-09-20T00:00:00.000Z",
  slots: [{ id: "s1", positions: ["스캔"], ended_at: null }],
  assignments: [],
  check_ins: [],
};

const ASSIGNED_DAY = {
  ...DAY,
  assignments: [
    {
      id: "a1",
      slot_id: "s1",
      position: "스캔",
      kind: "regular",
      profile_id: "p1",
      ended_at: null,
      profiles: { display_name: "이준호" },
    },
  ],
};

const EMPTY_PAYROLL = {
  wageRates: [],
  adjustments: [],
  excuseStatus: [],
  holidays: [],
};

beforeEach(() => {
  for (const mock of [
    getMonthScheduleMock,
    getMonthWindowMock,
    getOpenSlotsMock,
    getMonthAvailabilitiesMock,
    listActiveMembersMock,
    getQualificationsMock,
    getSlotRequestsMock,
    getPayrollMonthMock,
    getAllRehearsalsMock,
    createScheduleMock,
    setApplicationDeadlineMock,
    openDayMock,
    closeDayMock,
    setDayHoursMock,
    confirmScheduleMock,
    addAssignmentMock,
    grantPositionMock,
    setAdjustmentMock,
  ]) {
    mock.mockReset();
    mock.mockResolvedValue(undefined);
  }

  getMonthScheduleMock.mockResolvedValue([DAY]);
  getMonthWindowMock.mockResolvedValue(WINDOW_OPEN);
  getOpenSlotsMock.mockResolvedValue([]);
  getMonthAvailabilitiesMock.mockResolvedValue([]);
  listActiveMembersMock.mockResolvedValue([]);
  getQualificationsMock.mockResolvedValue([]);
  getSlotRequestsMock.mockResolvedValue([]);
  getPayrollMonthMock.mockResolvedValue(EMPTY_PAYROLL);
  getAllRehearsalsMock.mockResolvedValue([]);
});

type Params = { month?: string; date?: string; from?: string };

function render(params: Params = {}) {
  const { wrapper } = createWrapper();

  return renderHook((next: Params) => useScheduleAdminScreen(next), {
    wrapper,
    initialProps: params,
  });
}

async function mounted(params: Params = {}) {
  const hook = render(params);

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useScheduleAdminScreen — 달력과 날 상세가 한 자리다", () => {
  it("읽기 전에는 loading이다", () => {
    const { result } = render();

    expect(result.current.listState).toBe("loading");
  });

  it("근무표가 없는 달은 missing이고 만들기가 선다", async () => {
    getMonthWindowMock.mockResolvedValue(null);

    const { result } = await mounted();

    expect(result.current.listState).toBe("missing");
    expect(result.current.canCreate).toBe(true);
    expect(result.current.emptyTitle).toBe(
      `10월${SCHEDULE_ADMIN_COPY.monthNotYet}`,
    );
  });

  it("전부 지난 달이면 만들기가 없다", async () => {
    getMonthWindowMock.mockResolvedValue(null);

    const { result } = await mounted({ month: "2026-08" });

    expect(result.current.canCreate).toBe(false);
    expect(result.current.emptyTitle).toBe(
      `8월${SCHEDULE_ADMIN_COPY.monthMissing}`,
    );
  });

  it("마감이 안 지난 달은 확정이 잠기고 풀리는 날을 말한다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("calendar");
    expect(result.current.noticeLine).toContain("5일 남았어요");
    expect(result.current.confirmLocked).toBe(true);
    expect(result.current.confirmUnlockLine).toContain("10월 11일부터");
    expect(result.current.confirmLabel).toBe(SCHEDULE_ADMIN_COPY.confirmLocked);
  });

  it("마감이 지나면 확정이 풀리고 달 이름이 버튼에 붙는다", async () => {
    getMonthWindowMock.mockResolvedValue({
      ...WINDOW_OPEN,
      applicationDeadline: "2026-10-01",
    });

    const { result } = await mounted();

    expect(result.current.confirmLocked).toBe(false);
    expect(result.current.confirmUnlockLine).toBeNull();
    expect(result.current.confirmLabel).toBe(
      `10월${SCHEDULE_ADMIN_COPY.confirmSuffix}`,
    );
  });

  it("확정된 달은 확정 줄이 서고 확정 CTA가 사라진다", async () => {
    getMonthWindowMock.mockResolvedValue({
      ...WINDOW_OPEN,
      confirmedAt: "2026-10-02T06:00:00.000Z",
    });
    getMonthScheduleMock.mockResolvedValue([ASSIGNED_DAY]);

    const { result } = await mounted();

    expect(result.current.confirmed).toBe(true);
    expect(result.current.noticeLine).toContain("1명에게 알림을 보냈어요");
    expect(result.current.showConfirmCta).toBe(false);
    expect(result.current.showApplications).toBe(false);
  });

  it("달을 넘기면 열린 날과 고르던 날이 비워진다", async () => {
    const { result } = await mounted();

    act(() => result.current.startPicking());
    act(() => result.current.calendar.press("2026-10-20"));

    expect(result.current.pickedCount).toBe(1);

    act(() => result.current.goNextMonth());

    expect(result.current.month).toBe("2026-11");
    expect(result.current.picking).toBe(false);
    expect(result.current.pickedCount).toBe(0);

    act(() => result.current.goPrevMonth());

    expect(result.current.month).toBe("2026-10");
  });

  it("날 열기 모드는 닫힌 날 중 오늘부터만 고른다", async () => {
    const { result } = await mounted();

    act(() => result.current.startPicking());

    expect(result.current.picking).toBe(true);
    expect(result.current.canOpenDays).toBe(false);
    expect(result.current.openDaysLabel).toBe("열 날을 고르세요");

    expect(result.current.calendar.canPress("2026-10-01")).toBe(false);
    expect(result.current.calendar.canPress("2026-10-10")).toBe(false);
    expect(result.current.calendar.canPress("2026-10-20")).toBe(true);

    act(() => result.current.calendar.press("2026-10-20"));

    expect(result.current.calendar.stateOf("2026-10-20")).toBe("admin-picked");
    expect(result.current.openDaysLabel).toBe("1일 열기");
    expect(result.current.canOpenDays).toBe(true);
  });

  it("고른 날을 전부 열면 모드가 풀린다", async () => {
    const { result } = await mounted();

    act(() => result.current.startPicking());
    act(() => result.current.calendar.press("2026-10-20"));
    act(() => result.current.calendar.press("2026-10-21"));

    await act(async () => {
      await result.current.openPickedDays();
    });

    expect(openDayMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-10-20");
    expect(openDayMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-10-21");
    expect(result.current.picking).toBe(false);
    expect(result.current.toast).toBeNull();
  });

  it("일부만 실패하면 그 날만 남고 모드가 안 풀린다", async () => {
    openDayMock.mockImplementation((_client, workDate) =>
      workDate === "2026-10-21"
        ? Promise.reject(new Error("안 열렸다"))
        : Promise.resolve(undefined),
    );

    const { result } = await mounted();

    act(() => result.current.startPicking());
    act(() => result.current.calendar.press("2026-10-20"));
    act(() => result.current.calendar.press("2026-10-21"));

    await act(async () => {
      await result.current.openPickedDays();
    });

    expect(result.current.picking).toBe(true);
    expect(result.current.pickedCount).toBe(1);
    expect(result.current.toast?.message).toContain("10월 21일");
  });

  it("만들기 시트는 적은 마감일을 들고 오늘 이전은 못 보낸다", async () => {
    getMonthWindowMock.mockResolvedValue(null);

    const { result } = await mounted();

    act(() => result.current.openCreateSheet());

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ kind: "create", deadline: "", canSave: false }),
    );

    act(() => result.current.writeCreateDeadline("2026-10-01"));

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ deadline: "2026-10-01", canSave: false }),
    );

    act(() => result.current.writeCreateDeadline("2026-10-20"));

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ canSave: true }),
    );
  });

  it("만들기 시트는 보내고 성공하면 저절로 닫힌다", async () => {
    getMonthWindowMock.mockResolvedValue(null);

    const { result } = await mounted();

    act(() => result.current.openCreateSheet());
    act(() => result.current.writeCreateDeadline("2026-10-20"));
    act(() => result.current.createSchedule());

    await waitFor(() =>
      expect(createScheduleMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "2026-10",
        "2026-10-20",
      ),
    );

    await waitFor(() => expect(result.current.sheet).toBeNull());
  });

  it("마감일 당기기도 같은 꼴이다", async () => {
    const { result } = await mounted();

    act(() => result.current.openDeadlineSheet());

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ kind: "deadline", deadline: "2026-10-10" }),
    );

    act(() => result.current.changeDeadlineDraft("2026-10-06"));
    act(() => result.current.saveDeadline());

    await waitFor(() =>
      expect(setApplicationDeadlineMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "2026-10",
        "2026-10-06",
      ),
    );

    await waitFor(() => expect(result.current.sheet).toBeNull());
  });

  it("고치지 않은 동안은 칸이 서버가 든 마감일을 따라간다", async () => {
    const { result } = await mounted();

    act(() => result.current.openDeadlineSheet());

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ deadline: "2026-10-10" }),
    );

    act(() => result.current.changeDeadlineDraft("2026-10-06"));

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ deadline: "2026-10-06" }),
    );
  });

  it("오늘 이전을 적으면 보낼 수 없다", async () => {
    const { result } = await mounted();

    act(() => result.current.openDeadlineSheet());
    act(() => result.current.changeDeadlineDraft("2026-10-04"));

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ canSave: false }),
    );

    act(() => result.current.changeDeadlineDraft("2026-10-05"));

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ canSave: true }),
    );
  });

  it("확정 시트는 끝난 것을 시트가 말하고 닫는 손이 따로다", async () => {
    getOpenSlotsMock.mockResolvedValue([
      {
        slot_id: "s9",
        day_id: "d1",
        work_date: "2026-10-10",
        positions: ["스캔"],
      },
    ]);

    const { result } = await mounted();

    act(() => result.current.openConfirmSheet());

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ kind: "confirm", notifiedCount: 0 }),
    );

    act(() => result.current.confirmMonth());

    await waitFor(() =>
      expect(confirmScheduleMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-10"),
    );

    await waitFor(() =>
      expect(result.current.sheet).toEqual(
        expect.objectContaining({ kind: "confirm", done: true }),
      ),
    );

    act(() => result.current.closeSheet());

    expect(result.current.sheet).toBeNull();
  });

  it("승인할 일에서 오면 취소 토스트가 선다", async () => {
    const { result } = await mounted({ from: "approvals" });

    expect(result.current.toast?.message).toBe(
      SCHEDULE_ADMIN_COPY.arrivedFromApprovals,
    );

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });

  it("`?date=`로 들어오면 그 날 상세가 선다", async () => {
    const { result } = await mounted({ date: "2026-10-10" });

    expect(result.current.month).toBe("2026-10");
    expect(result.current.day?.dayId).toBe("d1");
    expect(result.current.day?.workDate).toBe("2026-10-10");
    expect(result.current.day?.serverNowMs).toBe(FIXED_NOW_MS);

    act(() => result.current.leaveDay());

    expect(result.current.day).toBeNull();
  });

  it("주소가 바뀌면 보던 달과 날이 따라간다", async () => {
    const hook = await mounted();

    expect(hook.result.current.day).toBeNull();

    hook.rerender({ date: "2026-10-10" });

    await waitFor(() => expect(hook.result.current.day?.dayId).toBe("d1"));
  });

  it("배정이 없는 날은 바로 닫고 있으면 경고 시트를 세운다", async () => {
    const { result } = await mounted({ date: "2026-10-10" });

    act(() => result.current.day?.onCloseDay());

    await waitFor(() =>
      expect(closeDayMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-10-10"),
    );

    getMonthScheduleMock.mockResolvedValue([ASSIGNED_DAY]);

    const assigned = await mounted({ date: "2026-10-10" });

    await waitFor(() =>
      expect(assigned.result.current.day?.assignments).toHaveLength(1),
    );

    act(() => assigned.result.current.day?.onCloseDay());

    expect(assigned.result.current.sheet).toEqual(
      expect.objectContaining({ kind: "close", assignmentCount: 1 }),
    );
  });

  it("근무 시간 시트는 그 날의 시각을 싣고 성공하면 닫힌다", async () => {
    const { result } = await mounted({ date: "2026-10-10" });

    act(() => result.current.day?.onPressHours());

    expect(result.current.sheet).toEqual(
      expect.objectContaining({
        kind: "hours",
        starts: "10:00",
        ends: "18:00",
        canSave: true,
      }),
    );

    act(() => result.current.writeHoursStarts("11:00"));
    act(() => result.current.writeHoursEnds("19:00"));

    expect(result.current.sheet).toEqual(
      expect.objectContaining({ starts: "11:00", ends: "19:00" }),
    );

    act(() => result.current.saveHours());

    await waitFor(() =>
      expect(setDayHoursMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "2026-10-10",
        "11:00",
        "19:00",
      ),
    );

    await waitFor(() => expect(result.current.sheet).toBeNull());
  });

  it("「자격도 주기」는 자격을 먼저 주고 배정한다", async () => {
    const { result } = await mounted({ date: "2026-10-10" });

    await act(async () => {
      result.current.day?.onGrantAndAssign(
        {
          profileId: "p1",
          kind: "regular",
          slotId: "s1",
          skipQualification: true,
        },
        "스캔",
      );
    });

    await waitFor(() =>
      expect(grantPositionMock).toHaveBeenCalledWith(FAKE_CLIENT, "p1", "스캔"),
    );

    await waitFor(() => expect(addAssignmentMock).toHaveBeenCalled());
  });

  it("조정을 보내면 그 날 id가 실려 가고 끝나면 비워진다", async () => {
    const { result } = await mounted({ date: "2026-10-10" });

    act(() =>
      result.current.day?.onSetAdjustment({
        profileId: "p1",
        minutes: 30,
        reason: "연장",
      }),
    );

    await waitFor(() =>
      expect(setAdjustmentMock).toHaveBeenCalledWith(FAKE_CLIENT, {
        dayId: "d1",
        profileId: "p1",
        minutes: 30,
        reason: "연장",
      }),
    );

    await waitFor(() => expect(result.current.day?.adjusted).toBe(true));

    act(() => result.current.day?.onAdjustSettled());

    await waitFor(() => expect(result.current.day?.adjusted).toBe(false));
  });

  it("날 상세가 쓰는 네 묶음을 그 날 것만 걸러 넘긴다", async () => {
    getPayrollMonthMock.mockResolvedValue({
      ...EMPTY_PAYROLL,
      holidays: [
        { holiday_date: "2026-10-10", source: "manual" },
        { holiday_date: "2026-10-11", source: "manual" },
      ],
      adjustments: [
        { day_id: "d1", profile_id: "p1", minutes: 30, reason: "연장" },
        { day_id: "d2", profile_id: "p1", minutes: 30, reason: "연장" },
      ],
    });
    getAllRehearsalsMock.mockResolvedValue([
      { work_date: "2026-10-10", profile_id: "p1", minutes: 60 },
      { work_date: "2026-10-11", profile_id: "p1", minutes: 60 },
    ]);
    getMonthAvailabilitiesMock.mockResolvedValue([
      { workDate: "2026-10-10", profileId: "p1", name: "이준호" },
    ]);

    const { result } = await mounted({ date: "2026-10-10" });

    await waitFor(() => expect(result.current.day?.holidays).toHaveLength(1));

    expect(result.current.day?.adjustments).toHaveLength(1);
    expect(result.current.day?.rehearsals).toHaveLength(1);
    expect(result.current.day?.applicationNames).toEqual(["이준호"]);
    expect(result.current.day?.appliedProfileIds).toEqual(["p1"]);
  });

  it("달력 칸은 확정 전이면 신청 수를, 확정 뒤면 빈 자리 수를 낸다", async () => {
    getMonthAvailabilitiesMock.mockResolvedValue([
      { workDate: "2026-10-10", profileId: "p1", name: "이준호" },
    ]);
    getOpenSlotsMock.mockResolvedValue([
      {
        slot_id: "s9",
        day_id: "d1",
        work_date: "2026-10-10",
        positions: ["스캔"],
      },
    ]);

    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.calendar.applicationCountOf("2026-10-10")).toBe(1),
    );

    expect(result.current.calendar.vacancyCountOf("2026-10-10")).toBeNull();
    expect(result.current.calendar.stateOf("2026-10-10")).toBe("admin-open");
    expect(result.current.calendar.isToday("2026-10-05")).toBe(true);
    expect(result.current.applicationsTitle).toContain("1건");
  });
});
