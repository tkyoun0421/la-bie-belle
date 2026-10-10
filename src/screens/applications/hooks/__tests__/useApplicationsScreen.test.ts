import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getMonthWindowMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const setApplicationDeadlineMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

const backMock = jest.fn();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({ back: backMock }),
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

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
const { DEADLINE_SHEET_COPY } =
  await import("@/features/availabilitySubmit/consts/availabilitySubmit.const");
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

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(NOW_MS);

  getMonthWindowMock.mockReset();
  setApplicationDeadlineMock.mockReset();
  backMock.mockClear();

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

  await waitFor(() => expect(getMonthWindowMock).toHaveBeenCalled());
  await act(async () => {});

  return hook;
}

describe("useApplicationsScreen — 마감일과 탭과 갈 데를 든다", () => {
  it("달을 안 받으면 서버 시계가 가리키는 달을 조각에 내려준다", async () => {
    const { result } = await mounted();

    expect(result.current.month).toBe("2026-10");
    expect(result.current.title).toBe("10월 근무 신청");
  });

  it("달을 받으면 그 달을 읽고 제목도 그 달이다", async () => {
    const { result } = await mounted("2026-11");

    expect(getMonthWindowMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-11");
    expect(result.current.title).toBe("11월 근무 신청");
  });

  it("마감 줄이 며칠 남았는지를 센다", async () => {
    const { result } = await mounted("2026-10");

    await waitFor(() =>
      expect(result.current.deadlineLine).toContain("7일 남았어요"),
    );
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

  it("빈 자리에 적을 마감일을 든다", async () => {
    const { result } = await mounted("2026-10");

    await waitFor(() =>
      expect(result.current.emptyDeadlineLine).toBe("마감은 10월 10일이에요"),
    );
    expect(APPLICATIONS_COPY.empty).toBe("아직 들어온 신청이 없어요");
  });

  it("날짜순이 먼저고 고른 탭을 조각에 내려준다", async () => {
    const { result } = await mounted("2026-10");

    expect(result.current.tab).toBe("date");

    act(() => result.current.chooseTab("person"));

    expect(result.current.tab).toBe("person");
  });

  it("없는 탭을 받으면 날짜순으로 돌아간다", async () => {
    const { result } = await mounted("2026-10");

    act(() => result.current.chooseTab("없는탭"));

    expect(result.current.tab).toBe("date");
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

describe("useApplicationsScreen — 실패 문안을 controller가 완성해 내려준다", () => {
  it("통신이 끊기면 failedLine이 그 슬라이스의 문안과 같다", async () => {
    setApplicationDeadlineMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted("2026-10");

    act(() => result.current.openDeadline());
    act(() => result.current.changeDeadlineDraft("2026-10-12"));
    act(() => result.current.saveDeadline());

    await waitFor(() => {
      // @ts-expect-error failedLine이 아직 없다
      expect(result.current.failedLine).toBe(DEADLINE_SHEET_COPY.saveFailed);
    });
  });

  it("failedLine이 빈 글자가 아니다", async () => {
    setApplicationDeadlineMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = await mounted("2026-10");

    act(() => result.current.openDeadline());
    act(() => result.current.changeDeadlineDraft("2026-10-12"));
    act(() => result.current.saveDeadline());

    await waitFor(() => expect(result.current.failed).toBe(true));

    // @ts-expect-error failedLine이 아직 없다
    expect(result.current.failedLine).toBeTruthy();
  });
});

describe("useApplicationsScreen — 갈 데를 controller가 정한다", () => {
  it("뒤로는 쌓인 자리로 되돌아간다", async () => {
    const { result } = await mounted();

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
