import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getNotificationsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const markNotificationsReadMock =
  jest.fn<(...args: unknown[]) => Promise<void>>();

const FIXED_NOW_MS = Date.UTC(2026, 9, 3, 1, 0, 0);

jest.unstable_mockModule(
  "@/entities/notification/api/getNotifications.api",
  () => ({
    getNotifications: getNotificationsMock,
  }),
);

jest.unstable_mockModule(
  "@/features/notificationRead/api/markNotificationsRead.api",
  () => ({ markNotificationsRead: markNotificationsReadMock }),
);

const clockPolicy = await import("@/entities/clock/model/serverClock.policy");

jest.unstable_mockModule("@/entities/clock/model/serverClock.policy", () => ({
  ...clockPolicy,
  nowWithOffset: () => FIXED_NOW_MS,
}));

jest.unstable_mockModule("@/entities/notification/utils/title.utils", () => ({
  toNotificationTitle: (row: { id: string }) =>
    row.id === "no-title" ? null : { title: `제목 ${row.id}` },
}));

jest.unstable_mockModule("@/entities/notification/utils/when.utils", () => ({
  toNotificationDateHeader: (date: string) => `머리 ${date}`,
  toNotificationReceivedTime: (at: string) => `시각 ${at}`,
}));

jest.unstable_mockModule(
  "@/entities/notification/model/destination.policy",
  () => ({
    toNotificationDestination: (row: { id: string }) =>
      row.id === "no-door" ? null : `/to/${row.id}`,
  }),
);

const FAKE_CLIENT = {} as never;

const backMock = jest.fn();
const replaceMock = jest.fn();
const pushMock = jest.fn();
const canGoBackMock = jest.fn<() => boolean>();

jest.unstable_mockModule("expo-router", () => ({
  useRouter: () => ({
    back: backMock,
    replace: replaceMock,
    push: pushMock,
    canGoBack: canGoBackMock,
  }),
}));

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useNotificationsScreen } =
  await import("@/screens/notifications/hooks/useNotificationsScreen");

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

function rowAt(id: string, createdAt: string, extra = {}) {
  return {
    id,
    kind: "shift_confirmed",
    createdAt,
    readAt: null,
    payload: {},
    ...extra,
  };
}

beforeEach(() => {
  getNotificationsMock.mockReset();
  markNotificationsReadMock.mockReset();
  backMock.mockClear();
  replaceMock.mockClear();
  pushMock.mockClear();
  canGoBackMock.mockReset();

  canGoBackMock.mockReturnValue(true);
  getNotificationsMock.mockResolvedValue([]);
  markNotificationsReadMock.mockResolvedValue(undefined);
});

describe("useNotificationsScreen — 쪽을 이어 붙여 날짜로 묶은 줄을 낸다", () => {
  it("받은 알림이 없으면 상태가 empty다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe("empty"));

    expect(result.current.groups).toEqual([]);
  });

  it("같은 날은 한 묶음이고 날마다 머리글이 선다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
      rowAt("b", "2026-10-03T02:00:00.000Z"),
      rowAt("c", "2026-10-01T02:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.groups).toHaveLength(2));

    expect(result.current.groups[0].rows.map((row) => row.id)).toEqual([
      "a",
      "b",
    ]);
    expect(result.current.groups[0].header).toBe(
      `머리 ${result.current.groups[0].date}`,
    );
    expect(result.current.groups[1].rows.map((row) => row.id)).toEqual(["c"]);
  });

  it("줄마다 제목과 시각과 안 읽음을 든다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
      rowAt("b", "2026-10-03T02:00:00.000Z", {
        readAt: "2026-10-03T03:00:00.000Z",
      }),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    const [first, second] = result.current.groups[0].rows;

    expect(first.title).toBe("제목 a");
    expect(first.time).toBe("시각 2026-10-03T01:00:00.000Z");
    expect(first.unread).toBe(true);
    expect(second.unread).toBe(false);
  });

  it("문장이 없는 줄은 안 낸다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
      rowAt("no-title", "2026-10-03T02:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    expect(result.current.groups[0].rows.map((row) => row.id)).toEqual(["a"]);
  });

  it("갈 곳이 없는 줄은 손이 없다 — 안 눌린다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("no-door", "2026-10-03T01:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    expect(result.current.groups[0].rows[0].press).toBeUndefined();
  });

  it("줄을 누르면 먼저 보내고 읽음을 찍는다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    act(() => result.current.groups[0].rows[0].press?.());

    expect(pushMock).toHaveBeenCalledWith("/to/a");

    await waitFor(() =>
      expect(markNotificationsReadMock).toHaveBeenCalledWith(FAKE_CLIENT, [
        "a",
      ]),
    );
  });

  it("읽음이 넘어져도 조용하다 — 이미 다른 화면이다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);
    markNotificationsReadMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    act(() => result.current.groups[0].rows[0].press?.());

    await waitFor(() =>
      expect(markNotificationsReadMock).toHaveBeenCalledTimes(1),
    );

    expect(pushMock).toHaveBeenCalledWith("/to/a");
    expect(result.current.state).toBe("end");
  });

  it("안 읽은 관리자 공지는 들어오는 것으로 찍힌다 — 안 눌러도 보낸다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("notice", "2026-10-03T01:00:00.000Z", { kind: "admin_notice" }),
    ]);
    const { wrapper } = createWrapper();

    renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() =>
      expect(markNotificationsReadMock).toHaveBeenCalledWith(FAKE_CLIENT, [
        "notice",
      ]),
    );
  });

  it("뒤로가 있으면 뒤로 가고 없으면 받은 자리로 바꾼다", async () => {
    canGoBackMock.mockReturnValue(true);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen("/admin"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe("empty"));

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("뒤로가 없고 받은 자리도 없으면 뿌리로 간다", async () => {
    canGoBackMock.mockReturnValue(false);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe("empty"));

    act(() => result.current.goBack());

    expect(replaceMock).toHaveBeenCalledWith("/");
  });

  it("바닥에 안 닿았으면 다음 쪽을 안 부른다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    act(() => result.current.loadNextWhenNear(false));

    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("다음 쪽이 없으면 바닥에 닿아도 안 부른다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe("end"));

    act(() => result.current.loadNextWhenNear(true));

    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("쪽이 가득 찼고 바닥에 닿으면 다음 쪽을 부른다", async () => {
    const full = Array.from({ length: 50 }, (_, at) =>
      rowAt(`row-${at}`, "2026-10-03T01:00:00.000Z"),
    );
    getNotificationsMock.mockResolvedValue(full);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe("normal"));

    act(() => result.current.loadNextWhenNear(true));

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));
  });

  it("읽기가 넘어지면 상태가 error고 다시 시도가 다시 읽는다", async () => {
    getNotificationsMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe("error"));

    getNotificationsMock.mockResolvedValue([]);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.state).toBe("empty"));
  });
});

describe("useNotificationsScreen — 몸통과 스크롤 판정을 controller가 든다", () => {
  function scrollTo(offsetY: number) {
    return {
      nativeEvent: {
        contentOffset: { y: offsetY },
        contentSize: { height: 2000 },
        layoutMeasurement: { height: 800 },
      },
    } as never;
  }

  it("읽는 중이면 몸통이 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), { wrapper });

    expect(result.current.body).toBe("loading");
  });

  it("넘어지면 몸통이 failed다", async () => {
    getNotificationsMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), { wrapper });

    await waitFor(() => expect(result.current.body).toBe("failed"));
  });

  it("받은 것이 없으면 몸통이 empty다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), { wrapper });

    await waitFor(() => expect(result.current.body).toBe("empty"));
  });

  it("쪽이 더 남은 줄 목록은 몸통이 rows다", async () => {
    getNotificationsMock.mockResolvedValue(
      Array.from({ length: 50 }, (_, at) =>
        rowAt(`row-${at}`, "2026-10-03T01:00:00.000Z"),
      ),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), { wrapper });

    await waitFor(() => expect(result.current.state).toBe("normal"));

    expect(result.current.body).toBe("rows");
  });

  it("끝까지 읽은 줄 목록도 몸통이 rows다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), { wrapper });

    await waitFor(() => expect(result.current.state).toBe("end"));

    expect(result.current.body).toBe("rows");
  });

  it("바닥에서 멀면 스크롤이 다음 쪽을 안 부른다", async () => {
    getNotificationsMock.mockResolvedValue(
      Array.from({ length: 50 }, (_, at) =>
        rowAt(`row-${at}`, "2026-10-03T01:00:00.000Z"),
      ),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), { wrapper });

    await waitFor(() => expect(result.current.state).toBe("normal"));

    act(() => result.current.loadNextOnScroll(scrollTo(0)));

    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("바닥에 닿은 스크롤이 다음 쪽을 부른다", async () => {
    getNotificationsMock.mockResolvedValue(
      Array.from({ length: 50 }, (_, at) =>
        rowAt(`row-${at}`, "2026-10-03T01:00:00.000Z"),
      ),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotificationsScreen(), { wrapper });

    await waitFor(() => expect(result.current.state).toBe("normal"));

    act(() => result.current.loadNextOnScroll(scrollTo(1200)));

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));
  });
});
