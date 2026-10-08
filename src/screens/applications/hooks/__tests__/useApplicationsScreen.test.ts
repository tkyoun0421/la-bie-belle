import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthAvailabilitiesMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthWindowMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setApplicationDeadlineMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/entities/availability/api/getMonthAvailabilities.api",
  () => ({ getMonthAvailabilities: getMonthAvailabilitiesMock }),
);

jest.unstable_mockModule(
  "@/entities/schedule/api/getMonthSchedule.api",
  () => ({ getMonthWindow: getMonthWindowMock }),
);

jest.unstable_mockModule(
  "@/features/availabilitySubmit/api/setApplicationDeadline.api",
  () => ({ setApplicationDeadline: setApplicationDeadlineMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { APPLICATIONS_COPY } =
  await import("@/screens/applications/consts/applications.const");
const { useApplicationsScreen } =
  await import("@/screens/applications/hooks/useApplicationsScreen");

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

const NOW_MS = Date.parse("2026-10-03T01:00:00.000Z");

const DEADLINE = "2026-10-10";

const APPLICATIONS = [
  { profileId: "p1", workDate: "2026-10-11", name: "최민재" },
  { profileId: "p2", workDate: "2026-10-10", name: "한지우" },
  { profileId: "p1", workDate: "2026-10-10", name: "최민재" },
];

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(NOW_MS);

  getMonthAvailabilitiesMock.mockReset();
  getMonthWindowMock.mockReset();
  setApplicationDeadlineMock.mockReset();

  getMonthAvailabilitiesMock.mockResolvedValue(APPLICATIONS);
  getMonthWindowMock.mockResolvedValue({
    applicationDeadline: DEADLINE,
    confirmedAt: null,
  });
  setApplicationDeadlineMock.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function mounted(month?: string) {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useApplicationsScreen(month), {
    wrapper,
  });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return hook;
}

describe("useApplicationsScreen — 한 질의를 두 방향으로 접는다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApplicationsScreen("2026-10"), {
      wrapper,
    });

    expect(result.current.listState).toBe("loading");
  });

  it("달을 안 받으면 서버 시계가 가리키는 달을 읽는다", async () => {
    const { result } = await mounted();

    expect(getMonthAvailabilitiesMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      "2026-10",
    );
    expect(result.current.title).toBe("10월 근무 신청");
  });

  it("달을 받으면 그 달을 읽고 제목도 그 달이다", async () => {
    const { result } = await mounted("2026-11");

    expect(getMonthWindowMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-11");
    expect(result.current.title).toBe("11월 근무 신청");
  });

  it("마감 줄이 며칠 남았는지를 센다", async () => {
    const { result } = await mounted("2026-10");

    expect(result.current.deadlineLine).toContain("7일 남았어요");
  });

  it("마감일이 없으면 마감 줄도 없다", async () => {
    getMonthWindowMock.mockResolvedValue({
      applicationDeadline: null,
      confirmedAt: null,
    });

    const { result } = await mounted("2026-10");

    expect(result.current.deadlineLine).toBeNull();
    expect(result.current.emptyDeadlineLine).toBeNull();
  });

  it("신청이 없으면 empty고 그 자리에 마감일을 적는다", async () => {
    getMonthAvailabilitiesMock.mockResolvedValue([]);

    const { result } = await mounted("2026-10");

    expect(result.current.listState).toBe("empty");
    expect(result.current.emptyDeadlineLine).toBe("마감은 10월 10일이에요");
    expect(APPLICATIONS_COPY.empty).toBe("아직 들어온 신청이 없어요");
  });

  it("날짜순이 먼저고 날짜가 이른 쪽부터 선다", async () => {
    const { result } = await mounted("2026-10");

    expect(result.current.listState).toBe("date");
    expect(result.current.dateGroups.map((group) => group.key)).toEqual([
      "2026-10-10",
      "2026-10-11",
    ]);
    expect(result.current.dateGroups[0].heading).toContain("10월 10일");
    expect(result.current.dateGroups[0].names.map((one) => one.name)).toEqual([
      "한지우",
      "최민재",
    ]);
  });

  it("사람순으로 바꾸면 그 사람이 일할 수 있는 날이 한 줄이다", async () => {
    const { result } = await mounted("2026-10");

    act(() => result.current.chooseTab("person"));

    expect(result.current.listState).toBe("person");
    expect(result.current.tab).toBe("person");
    expect(result.current.personGroups[0].displayName).toBe("최민재");
    expect(result.current.personGroups[0].dates).toContain("10월 10일");
    expect(result.current.personGroups[0].dates).toContain("10월 11일");
  });

  it("탭을 바꿔도 서버에 다시 안 묻는다", async () => {
    const { result } = await mounted("2026-10");

    const asked = getMonthAvailabilitiesMock.mock.calls.length;

    act(() => result.current.chooseTab("person"));

    expect(getMonthAvailabilitiesMock.mock.calls.length).toBe(asked);
  });

  it("시트를 열면 지금 마감일과 오늘을 들고 선다", async () => {
    const { result } = await mounted("2026-10");

    expect(result.current.sheet).toBeNull();

    act(() => result.current.openDeadline());

    expect(result.current.sheet).toEqual({
      deadline: DEADLINE,
      today: "2026-10-03",
      canSave: true,
    });
  });

  it("고치지 않은 동안은 칸이 서버가 든 마감일을 따라간다", async () => {
    const { result } = await mounted("2026-10");

    act(() => result.current.openDeadline());

    expect(result.current.sheet?.deadline).toBe(DEADLINE);

    act(() => result.current.changeDeadlineDraft("2026-10-12"));

    expect(result.current.sheet?.deadline).toBe("2026-10-12");
  });

  it("오늘 이전을 적으면 보낼 수 없다", async () => {
    const { result } = await mounted("2026-10");

    act(() => result.current.openDeadline());
    act(() => result.current.changeDeadlineDraft("2026-10-02"));

    expect(result.current.sheet?.canSave).toBe(false);

    act(() => result.current.changeDeadlineDraft("2026-10-03"));

    expect(result.current.sheet?.canSave).toBe(true);
  });

  it("마감일이 없으면 시트가 오늘로 선다", async () => {
    getMonthWindowMock.mockResolvedValue({
      applicationDeadline: null,
      confirmedAt: null,
    });

    const { result } = await mounted("2026-10");

    act(() => result.current.openDeadline());

    expect(result.current.sheet?.deadline).toBe("2026-10-03");
  });

  it("저장하면 그 달과 고른 날로 가고 끝나면 시트가 닫힌다", async () => {
    const { result } = await mounted("2026-10");

    act(() => result.current.openDeadline());
    act(() => result.current.changeDeadlineDraft("2026-10-12"));
    act(() => result.current.saveDeadline());

    await waitFor(() =>
      expect(setApplicationDeadlineMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "2026-10",
        "2026-10-12",
      ),
    );

    await waitFor(() => expect(result.current.sheet).toBeNull());
    expect(result.current.saving).toBe(false);
  });

  it("통신이 끊기면 시트를 연 채로 둔다", async () => {
    setApplicationDeadlineMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted("2026-10");

    act(() => result.current.openDeadline());
    act(() => result.current.changeDeadlineDraft("2026-10-12"));
    act(() => result.current.saveDeadline());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.sheet).not.toBeNull();
  });

  it("닫으면 시트가 사라지고 실패도 같이 치워진다", async () => {
    setApplicationDeadlineMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted("2026-10");

    act(() => result.current.openDeadline());
    act(() => result.current.changeDeadlineDraft("2026-10-12"));
    act(() => result.current.saveDeadline());

    await waitFor(() => expect(result.current.failed).toBe(true));

    act(() => result.current.closeDeadline());

    expect(result.current.sheet).toBeNull();
    expect(result.current.failed).toBe(false);
  });
});
