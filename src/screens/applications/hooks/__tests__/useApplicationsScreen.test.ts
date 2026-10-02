import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/screens/applications/hooks/useApplicationsScreen.ts
//
// 그 달 근무 신청을 두 방향으로 보는 화면의 controller다. `.tsx`가 질의 둘과 쓰기 하나를
// 직접 들고 탭과 시트 열림을 `useState`로 쥐고 있었다.
//
// **탭은 그릴 것만 가르고 질의는 하나다.** 날짜순과 사람순이 같은 답을 두 방향으로 접어서
// 로딩·빈 상태와 탭 둘이 `listState` 하나로 접힌다 — 탭이 읽을 것을 가르는 통계와 갈린다.
//
// **시트 열림이 통신에 매여 있다.** 저장이 끝나면 저절로 닫히고 실패하면 열린 채로 남는다 —
// 사람이 열고 사람이 닫는 상태가 아니라 controller 것이다.
//
// **「지금」은 서버 시계에서 온다.** 마감까지 며칠 남았는지가 하루 밀린 기기에서 달라지면
// 안 된다. 그래서 여기서 기기 시계를 고정해 두고 센다.

const getMonthAvailabilitiesMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const getMonthWindowMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setApplicationDeadlineMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

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

const FAKE_CLIENT = {} as never;

/** KST로 2026-10-03 오전 10시다 — 그 달이 `"2026-10"`이고 오늘이 3일이다. */
const NOW_MS = Date.parse("2026-10-03T01:00:00.000Z");

const DEADLINE = "2026-10-10";

const APPLICATIONS = [
  {
    profile_id: "p1",
    work_date: "2026-10-11",
    profiles: { display_name: "최민재" },
  },
  {
    profile_id: "p2",
    work_date: "2026-10-10",
    profiles: { display_name: "한지우" },
  },
  {
    profile_id: "p1",
    work_date: "2026-10-10",
    profiles: { display_name: "최민재" },
  },
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
  const hook = renderHook(() => useApplicationsScreen(FAKE_CLIENT, month), {
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

    const { result } = renderHook(
      () => useApplicationsScreen(FAKE_CLIENT, "2026-10"),
      { wrapper },
    );

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
    });
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
    act(() => result.current.saveDeadline("2026-10-12"));

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
    act(() => result.current.saveDeadline("2026-10-12"));

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.sheet).not.toBeNull();
  });

  it("닫으면 시트가 사라지고 실패도 같이 치워진다", async () => {
    setApplicationDeadlineMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted("2026-10");

    act(() => result.current.openDeadline());
    act(() => result.current.saveDeadline("2026-10-12"));

    await waitFor(() => expect(result.current.failed).toBe(true));

    act(() => result.current.closeDeadline());

    expect(result.current.sheet).toBeNull();
    expect(result.current.failed).toBe(false);
  });
});
