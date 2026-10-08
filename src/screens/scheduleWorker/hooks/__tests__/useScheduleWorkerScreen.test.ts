import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const TODAY = "2026-10-03";
const MONTH = "2026-10";

const getCurrentUserMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyProfileMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getProfilePrivateMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const countUnreadMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthWindowMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthScheduleMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMyAvailabilityMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getSlotRequestsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getPendingApprovalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const submitAvailabilityMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const respondRequestMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const createCancelRequestMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule("@/shared/lib/kstToday.lib", () => ({
  kstToday: () => TODAY,
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
  "@/entities/notification/api/countUnreadNotifications.api",
  () => ({ countUnreadNotifications: countUnreadMock }),
);

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({
    getMonthSchedule: getMonthScheduleMock,
    getMonthWindow: getMonthWindowMock,
  }),
);

jest.unstable_mockModule(
  "@/entities/availability/api/getMyAvailability.api",
  () => ({ getMyAvailability: getMyAvailabilityMock }),
);

jest.unstable_mockModule(
  "@/entities/workRequest/api/getSlotRequests.api",
  () => ({
    getSlotRequests: getSlotRequestsMock,
  }),
);

jest.unstable_mockModule(
  "@/entities/workRequest/api/getPendingApprovals.api",
  () => ({ getPendingApprovals: getPendingApprovalsMock }),
);

jest.unstable_mockModule(
  "@/features/availabilitySubmit/api/submitAvailability.api",
  () => ({ submitAvailability: submitAvailabilityMock }),
);

jest.unstable_mockModule(
  "@/features/workRequest/api/respondRequest.api",
  () => ({
    respondRequest: respondRequestMock,
  }),
);

jest.unstable_mockModule(
  "@/features/workRequest/api/createCancelRequest.api",
  () => ({ createCancelRequest: createCancelRequestMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { SCHEDULE_WORKER_COPY } =
  await import("@/screens/scheduleWorker/consts/scheduleWorker.const");
const { useScheduleWorkerScreen } =
  await import("@/screens/scheduleWorker/hooks/useScheduleWorkerScreen");

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

const MY_DAY = {
  id: "d1",
  work_date: "2026-10-17",
  starts_at: "10:00:00",
  ends_at: "18:00:00",
  opened_at: "2026-09-01T00:00:00.000Z",
  slots: [
    { id: "s1", positions: ["안내"], ended_at: null },
    { id: "s2", positions: ["서빙"], ended_at: null },
  ],
  assignments: [
    {
      id: "a1",
      slot_id: "s1",
      position: "안내",
      kind: "regular",
      profile_id: "p1",
      ended_at: null,
      profiles: { display_name: "이준호" },
    },
  ],
  check_ins: [],
};

const OTHER_DAY = {
  ...MY_DAY,
  id: "d2",
  work_date: "2026-10-20",
  assignments: [],
};

const REQUEST = {
  id: "r1",
  slot_id: "s2",
  closed_at: null,
  expires_at: "2099-01-01T00:00:00.000Z",
  request_candidates: [
    {
      profile_id: "p1",
      status: "pending",
      expires_at: "2099-01-01T00:00:00.000Z",
    },
  ],
  slots: {
    id: "s2",
    positions: ["서빙"],
    days: {
      work_date: "2026-10-20",
      starts_at: "10:00:00",
      ends_at: "18:00:00",
    },
  },
};

const MY_CANCEL_REQUEST = {
  id: "ap1",
  assignment_id: "a1",
  reason: "몸이 아파요",
  created_at: "2026-10-02T00:00:00.000Z",
  assignments: {
    day_id: "d1",
    position: "안내",
    days: {
      work_date: "2026-10-17",
      starts_at: "10:00:00",
      ends_at: "18:00:00",
    },
  },
  profiles: { display_name: "이준호", photo_url: null },
};

const CONFIRMED = {
  applicationDeadline: "2026-09-20",
  confirmedAt: "2026-09-25T00:00:00.000Z",
};

const COLLECTING = { applicationDeadline: "2026-10-20", confirmedAt: null };

const AWAITING = { applicationDeadline: "2026-09-20", confirmedAt: null };

beforeEach(() => {
  for (const mock of [
    getCurrentUserMock,
    getMyProfileMock,
    getProfilePrivateMock,
    countUnreadMock,
    getMonthWindowMock,
    getMonthScheduleMock,
    getMyAvailabilityMock,
    getSlotRequestsMock,
    getPendingApprovalsMock,
    submitAvailabilityMock,
    respondRequestMock,
    createCancelRequestMock,
  ]) {
    mock.mockReset();
  }

  getCurrentUserMock.mockResolvedValue({
    id: "u1",
    email: "a@b.c",
    user_metadata: {},
  });
  getMyProfileMock.mockResolvedValue({
    id: "p1",
    display_name: "이준호",
    photo_url: null,
    role: "member",
    submitted_at: null,
    approved_at: "2026-01-01T00:00:00.000Z",
    rejected_at: null,
    blocked_at: null,
    left_at: null,
    notifications_enabled: true,
  });
  getProfilePrivateMock.mockResolvedValue({
    email: "a@b.c",
    phone: "010-0000-0001",
    birth_date: "1998-03-04",
    gender: "male",
  });
  countUnreadMock.mockResolvedValue(0);
  getMonthWindowMock.mockResolvedValue(CONFIRMED);
  getMonthScheduleMock.mockResolvedValue([MY_DAY, OTHER_DAY]);
  getMyAvailabilityMock.mockResolvedValue([]);
  getSlotRequestsMock.mockResolvedValue([]);
  getPendingApprovalsMock.mockResolvedValue([]);
  submitAvailabilityMock.mockResolvedValue(undefined);
  respondRequestMock.mockResolvedValue(undefined);
  createCancelRequestMock.mockResolvedValue(undefined);
});

async function mounted(params: { month?: string; date?: string } = {}) {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useScheduleWorkerScreen(params), {
    wrapper,
  });

  await waitFor(() =>
    expect(hook.result.current.bodyState).not.toBe("loading"),
  );
  await waitFor(() => expect(hook.result.current.myProfileId).toBe("p1"));

  return hook;
}

describe("useScheduleWorkerScreen — 한 화면이 달의 상태를 탄다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useScheduleWorkerScreen({}), {
      wrapper,
    });

    expect(result.current.bodyState).toBe("loading");
  });

  it("확정된 달은 근무표고 앱바가 그 달을 부른다", async () => {
    const { result } = await mounted();

    expect(result.current.bodyState).toBe("confirmed");
    expect(result.current.month).toBe(MONTH);
    expect(result.current.monthTitle).toBe("2026년 10월");
    expect(result.current.deadlineLine).toBeNull();
  });

  it("접수 중인 달은 마감 줄이 서고 보내기 자리가 열린다", async () => {
    getMonthWindowMock.mockResolvedValue(COLLECTING);

    const { result } = await mounted();

    expect(result.current.bodyState).toBe("collecting");
    expect(result.current.deadlineLine).toContain("10월 20일");
  });

  it("안 만든 달은 열면 알려준다고 말한다", async () => {
    getMonthWindowMock.mockResolvedValue(null);

    const { result } = await mounted();

    expect(result.current.bodyState).toBe("not_created");
    expect(result.current.notice).toBe(
      "아직 10월 근무 신청을 받지 않아요. 열리면 알려드릴게요",
    );
  });

  it("마감됐는데 아직 확정 전이면 만드는 중이라고 말한다", async () => {
    getMonthWindowMock.mockResolvedValue(AWAITING);

    const { result } = await mounted();

    expect(result.current.bodyState).toBe("closed_awaiting_confirmation");
    expect(result.current.notice).toBe(
      SCHEDULE_WORKER_COPY.awaitingConfirmation,
    );
  });
});

describe("useScheduleWorkerScreen — 고른 날은 아직 안 보낸 로컬 상태다", () => {
  it("서버가 준 신청이 고른 날로 실리고 누르면 뒤집힌다", async () => {
    getMonthWindowMock.mockResolvedValue(COLLECTING);
    getMyAvailabilityMock.mockResolvedValue(["2026-10-17"]);

    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.cellStateOf("2026-10-17")).toBe("picked"),
    );

    act(() => result.current.pressDay?.("2026-10-17"));

    expect(result.current.cellStateOf("2026-10-17")).toBe("unconfirmed");

    act(() => result.current.pressDay?.("2026-10-20"));

    expect(result.current.cellStateOf("2026-10-20")).toBe("picked");
  });

  it("보내기가 그 달과 고른 날을 통째로 보내고 토스트가 선다", async () => {
    getMonthWindowMock.mockResolvedValue(COLLECTING);
    getMyAvailabilityMock.mockResolvedValue(["2026-10-17"]);

    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.cellStateOf("2026-10-17")).toBe("picked"),
    );

    act(() => result.current.submit());

    await waitFor(() =>
      expect(submitAvailabilityMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH, [
        "2026-10-17",
      ]),
    );

    await waitFor(() =>
      expect(result.current.toast).toBe("10월 근무 신청을 보냈어요"),
    );

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });

  it("못 보내면 그 말이 토스트로 선다", async () => {
    getMonthWindowMock.mockResolvedValue(COLLECTING);
    submitAvailabilityMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.submit());

    await waitFor(() =>
      expect(result.current.toast).toBe(SCHEDULE_WORKER_COPY.sendFailed),
    );
  });
});

describe("useScheduleWorkerScreen — 날짜 하나에 문이 둘이다", () => {
  it("요청이 없는 날은 명단 시트가 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-17"));

    expect(result.current.sheet?.kind).toBe("roster");

    if (result.current.sheet?.kind !== "roster") {
      throw new Error("명단 시트가 아니다");
    }

    expect(result.current.sheet.title).toBe("10월 17일(토)");
    expect(result.current.sheet.subtitle).toBe("10:00 – 18:00 · 1명");
    expect(result.current.sheet.rows).toHaveLength(2);
    expect(result.current.sheet.showActions).toBe(true);
    expect(result.current.sheet.actionsEnabled).toBe(true);
  });

  it("요청이 살아 있는 날은 요청 시트가 먼저 선다", async () => {
    getSlotRequestsMock.mockResolvedValue([REQUEST]);

    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.cellStateOf("2026-10-20")).toBe("requested"),
    );

    act(() => result.current.pressDay?.("2026-10-20"));

    expect(result.current.sheet?.kind).toBe("request");

    if (result.current.sheet?.kind !== "request") {
      throw new Error("요청 시트가 아니다");
    }

    expect(result.current.sheet.subtitle).toBe(
      "10월 20일(화) · 서빙 · 10:00 – 18:00",
    );
    expect(result.current.sheet.state).toBe("normal");
  });

  it("만료된 요청은 끝난 것으로 선다", async () => {
    getSlotRequestsMock.mockResolvedValue([
      { ...REQUEST, expires_at: "2020-01-01T00:00:00.000Z" },
    ]);

    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-20"));

    if (result.current.sheet?.kind !== "request") {
      throw new Error("요청 시트가 아니다");
    }

    expect(result.current.sheet.state).toBe("ended");
  });

  it("요청이 온 날이 있으면 달력 아래 줄이 점선을 설명한다", async () => {
    getSlotRequestsMock.mockResolvedValue([REQUEST]);

    const { result } = await mounted();

    await waitFor(() =>
      expect(result.current.calendarNote).toBe(
        SCHEDULE_WORKER_COPY.calendarNoteWithRequest,
      ),
    );
  });
});

describe("useScheduleWorkerScreen — 늦은 수락은 오류 블록이 아니다", () => {
  it("수락이 그 요청 id로 가고 성공하면 시트가 닫힌다", async () => {
    getSlotRequestsMock.mockResolvedValue([REQUEST]);

    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-20"));
    act(() => result.current.accept());

    await waitFor(() =>
      expect(respondRequestMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "r1",
        "accept",
      ),
    );

    await waitFor(() => expect(result.current.sheet).toBeNull());
  });

  it("거절도 같은 문으로 나간다", async () => {
    getSlotRequestsMock.mockResolvedValue([REQUEST]);

    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-20"));
    act(() => result.current.decline());

    await waitFor(() =>
      expect(respondRequestMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "r1",
        "decline",
      ),
    );
  });

  it("자리가 찼으면 시트를 닫고 사건을 달력 아래 줄에 남긴다", async () => {
    getSlotRequestsMock.mockResolvedValue([REQUEST]);
    respondRequestMock.mockRejectedValue(new DomainError("slot_full"));

    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-20"));
    act(() => result.current.accept());

    await waitFor(() =>
      expect(result.current.toast).toBe(SCHEDULE_WORKER_COPY.seatTaken),
    );

    expect(result.current.sheet).toBeNull();
    expect(result.current.calendarNote).toBe(
      "10월 20일 서빙 자리는 다른 분이 맡았어요",
    );
  });

  it("통신이 끊긴 것은 시트를 열어 둔 채 실패를 세운다", async () => {
    getSlotRequestsMock.mockResolvedValue([REQUEST]);
    respondRequestMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-20"));
    act(() => result.current.accept());

    await waitFor(() => {
      if (result.current.sheet?.kind !== "request") {
        throw new Error("요청 시트가 아니다");
      }

      expect(result.current.sheet.failed).toBe(true);
    });
  });
});

describe("useScheduleWorkerScreen — 취소 사유가 여기 산다", () => {
  it("명단 시트에서 취소로 얼굴이 바뀌고 사유를 적어야 보낼 수 있다", async () => {
    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-17"));
    act(() => result.current.askCancel());

    if (result.current.sheet?.kind !== "cancel") {
      throw new Error("취소 시트가 아니다");
    }

    expect(result.current.sheet.title).toBe("근무 취소 · 10월 17일(토) 안내");
    expect(result.current.sheet.canSend).toBe(false);

    act(() => result.current.writeReason("   "));

    if (result.current.sheet?.kind !== "cancel") {
      throw new Error("취소 시트가 아니다");
    }

    expect(result.current.sheet.canSend).toBe(false);

    act(() => result.current.writeReason(" 몸이 아파요 "));

    if (result.current.sheet?.kind !== "cancel") {
      throw new Error("취소 시트가 아니다");
    }

    expect(result.current.sheet.canSend).toBe(true);
  });

  it("취소 요청이 그 배정 id와 다듬은 사유로 가고 보낸 뒤 시트가 닫힌다", async () => {
    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-17"));
    act(() => result.current.askCancel());
    act(() => result.current.writeReason(" 몸이 아파요 "));
    act(() => result.current.sendCancel());

    await waitFor(() =>
      expect(createCancelRequestMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "a1",
        "몸이 아파요",
      ),
    );

    await waitFor(() => expect(result.current.sheet).toBeNull());
  });

  it("보낸 뒤 다시 취소를 열면 적었던 글이 안 남는다", async () => {
    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-17"));
    act(() => result.current.askCancel());
    act(() => result.current.writeReason("몸이 아파요"));
    act(() => result.current.sendCancel());

    await waitFor(() => expect(result.current.sheet).toBeNull());

    act(() => result.current.askCancelOn("2026-10-17"));

    if (result.current.sheet?.kind !== "cancel") {
      throw new Error("취소 시트가 아니다");
    }

    expect(result.current.sheet.reason).toBe("");
  });

  it("못 보내면 시트가 열린 채 적은 글이 남는다", async () => {
    createCancelRequestMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-17"));
    act(() => result.current.askCancel());
    act(() => result.current.writeReason("몸이 아파요"));
    act(() => result.current.sendCancel());

    await waitFor(() => {
      if (result.current.sheet?.kind !== "cancel") {
        throw new Error("취소 시트가 아니다");
      }

      expect(result.current.sheet.failed).toBe(true);
      expect(result.current.sheet.reason).toBe("몸이 아파요");
    });
  });

  it("이미 요청을 걸어둔 근무는 배지가 서고 버튼이 잠긴다", async () => {
    getPendingApprovalsMock.mockResolvedValue([MY_CANCEL_REQUEST]);

    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-17"));

    await waitFor(() => {
      if (result.current.sheet?.kind !== "roster") {
        throw new Error("명단 시트가 아니다");
      }

      expect(result.current.sheet.myBadge).toBe("취소 요청 중");
      expect(result.current.sheet.showActions).toBe(true);
      expect(result.current.sheet.actionsEnabled).toBe(false);
    });
  });

  it("포지션 순에서 바로 취소를 열면 그 날 시트가 취소 얼굴로 선다", async () => {
    const { result } = await mounted();

    act(() => result.current.askCancelOn("2026-10-17"));

    expect(result.current.sheet?.kind).toBe("cancel");
  });
});

describe("useScheduleWorkerScreen — 보기와 달 이동", () => {
  it("포지션 순으로 바꾸면 줄이 서고 「내 근무만」이 남의 날을 지운다", async () => {
    const { result } = await mounted();

    act(() => result.current.showView("position"));

    expect(result.current.view).toBe("position");
    expect(result.current.agendaEntries).toHaveLength(2);

    act(() => result.current.showMine(true));

    expect(result.current.showMineOnly).toBe(true);
    expect(result.current.agendaEntries).toHaveLength(1);
    expect(result.current.agendaEntries[0].workDate).toBe("2026-10-17");
    expect(result.current.cellStateOf("2026-10-20")).toBe("muted");
  });

  it("아코디언은 사람이 열고 사람이 닫는다", async () => {
    const { result } = await mounted();

    act(() => result.current.toggleAgendaDay("2026-10-17"));

    expect(result.current.expanded).toEqual(["2026-10-17"]);

    act(() => result.current.toggleAgendaDay("2026-10-17"));

    expect(result.current.expanded).toEqual([]);
  });

  it("달을 넘기면 연 것과 남은 사건이 처음으로 돌아간다", async () => {
    getSlotRequestsMock.mockResolvedValue([REQUEST]);
    respondRequestMock.mockRejectedValue(new DomainError("slot_full"));

    const { result } = await mounted();

    act(() => result.current.toggleAgendaDay("2026-10-17"));
    act(() => result.current.pressDay?.("2026-10-20"));
    act(() => result.current.accept());

    await waitFor(() =>
      expect(result.current.calendarNote).toBe(
        "10월 20일 서빙 자리는 다른 분이 맡았어요",
      ),
    );

    act(() => result.current.goNextMonth());

    expect(result.current.monthTitle).toBe("2026년 11월");
    expect(result.current.expanded).toEqual([]);
    expect(result.current.sheet).toBeNull();

    await waitFor(() =>
      expect(getMonthScheduleMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-11"),
    );

    act(() => result.current.goPrevMonth());

    expect(result.current.monthTitle).toBe("2026년 10월");
  });

  it("알림이 와 있으면 종에 점이 선다", async () => {
    countUnreadMock.mockResolvedValue(3);

    const { result } = await mounted();

    await waitFor(() => expect(result.current.unread).toBe(true));
  });
});

describe("useScheduleWorkerScreen — 열려 있는 것만 뒤로가 닫는다", () => {
  it("닫을 것이 없으면 뒤로를 안 가로챈다", async () => {
    const { result } = await mounted();

    expect(result.current.closeTop).toBeNull();
  });

  it("시트가 열리면 그 손이 서고 눌러서 닫는다", async () => {
    const { result } = await mounted();

    act(() => result.current.pressDay?.("2026-10-17"));

    expect(result.current.closeTop).not.toBeNull();

    act(() => {
      result.current.closeTop?.();
    });

    expect(result.current.sheet).toBeNull();
  });

  it("알림으로 들어온 날짜가 시트를 열어 둔 채 선다", async () => {
    const { result } = await mounted({ date: "2026-10-17" });

    expect(result.current.sheet?.kind).toBe("roster");
    expect(result.current.monthTitle).toBe("2026년 10월");
  });
});
