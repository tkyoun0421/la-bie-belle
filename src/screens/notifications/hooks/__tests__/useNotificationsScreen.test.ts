import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/screens/notifications/hooks/useNotificationsScreen.ts
//
// 알림 목록 화면의 controller다. `.tsx`가 쪽을 이어 붙이고 상태를 고르고 날짜로 묶고
// 제목·시각·목적지를 지어 줄마다 손을 달고 있었다 — 그 전부가 여기 온다.
//
// **읽음이 두 길로 찍힌다.** 관리자 공지는 갈 곳이 없어 화면에 들어오는 것으로 찍히고
// (`useEffect`), 나머지는 누르는 것으로 찍힌다. 둘 다 통신이라 `.tsx`가 가질 것이 아니다.
//
// 제목·시각·목적지를 짓는 손은 각자 짝 테스트가 있어 여기서는 모킹한다 — 이 훅이 재는 것은
// 그 손들을 어떤 줄에 어떻게 매다는지다.

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

// 시계만 못 박고 나머지는 원래 것을 그대로 쓴다 — `clock.store`가 같은 모듈에서
// `serverOffset`을 당긴다.
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

const FAKE_CLIENT = {} as never;

function fakeRouter(canGoBack = true) {
  return {
    canGoBack: () => canGoBack,
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  };
}

function rowAt(id: string, createdAt: string, extra = {}) {
  return {
    id,
    kind: "shift_confirmed",
    created_at: createdAt,
    read_at: null,
    payload: {},
    ...extra,
  };
}

beforeEach(() => {
  getNotificationsMock.mockReset();
  markNotificationsReadMock.mockReset();

  getNotificationsMock.mockResolvedValue([]);
  markNotificationsReadMock.mockResolvedValue(undefined);
});

describe("useNotificationsScreen — 쪽을 이어 붙여 날짜로 묶은 줄을 낸다", () => {
  it("받은 알림이 없으면 상태가 empty다", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fakeRouter()),
      { wrapper },
    );

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

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fakeRouter()),
      { wrapper },
    );

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
        read_at: "2026-10-03T03:00:00.000Z",
      }),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fakeRouter()),
      { wrapper },
    );

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

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fakeRouter()),
      { wrapper },
    );

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    expect(result.current.groups[0].rows.map((row) => row.id)).toEqual(["a"]);
  });

  it("갈 곳이 없는 줄은 손이 없다 — 안 눌린다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("no-door", "2026-10-03T01:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fakeRouter()),
      { wrapper },
    );

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    expect(result.current.groups[0].rows[0].press).toBeUndefined();
  });

  it("줄을 누르면 먼저 보내고 읽음을 찍는다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);
    const router = fakeRouter();
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, router),
      { wrapper },
    );

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    act(() => result.current.groups[0].rows[0].press?.());

    expect(router.push).toHaveBeenCalledWith("/to/a");

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
    const router = fakeRouter();
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, router),
      { wrapper },
    );

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    act(() => result.current.groups[0].rows[0].press?.());

    await waitFor(() =>
      expect(markNotificationsReadMock).toHaveBeenCalledTimes(1),
    );

    expect(router.push).toHaveBeenCalledWith("/to/a");
    expect(result.current.state).toBe("end");
  });

  it("안 읽은 관리자 공지는 들어오는 것으로 찍힌다 — 안 눌러도 보낸다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("notice", "2026-10-03T01:00:00.000Z", { kind: "admin_notice" }),
    ]);
    const { wrapper } = createWrapper();

    renderHook(() => useNotificationsScreen(FAKE_CLIENT, fakeRouter()), {
      wrapper,
    });

    await waitFor(() =>
      expect(markNotificationsReadMock).toHaveBeenCalledWith(FAKE_CLIENT, [
        "notice",
      ]),
    );
  });

  it("뒤로가 있으면 뒤로 가고 없으면 받은 자리로 바꾼다", async () => {
    const back = fakeRouter(true);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, back, "/admin"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.state).toBe("empty"));

    act(() => result.current.goBack());

    expect(back.back).toHaveBeenCalledTimes(1);
    expect(back.replace).not.toHaveBeenCalled();
  });

  it("뒤로가 없고 받은 자리도 없으면 뿌리로 간다", async () => {
    const fresh = fakeRouter(false);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fresh),
      { wrapper },
    );

    await waitFor(() => expect(result.current.state).toBe("empty"));

    act(() => result.current.goBack());

    expect(fresh.replace).toHaveBeenCalledWith("/");
  });

  it("바닥에 안 닿았으면 다음 쪽을 안 부른다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fakeRouter()),
      { wrapper },
    );

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    act(() => result.current.loadNextWhenNear(false));

    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("다음 쪽이 없으면 바닥에 닿아도 안 부른다", async () => {
    getNotificationsMock.mockResolvedValue([
      rowAt("a", "2026-10-03T01:00:00.000Z"),
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fakeRouter()),
      { wrapper },
    );

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

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fakeRouter()),
      { wrapper },
    );

    await waitFor(() => expect(result.current.state).toBe("normal"));

    act(() => result.current.loadNextWhenNear(true));

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));
  });

  it("읽기가 넘어지면 상태가 error고 다시 시도가 다시 읽는다", async () => {
    getNotificationsMock.mockRejectedValue(new Error("끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useNotificationsScreen(FAKE_CLIENT, fakeRouter()),
      { wrapper },
    );

    await waitFor(() => expect(result.current.state).toBe("error"));

    getNotificationsMock.mockResolvedValue([]);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.state).toBe("empty"));
  });
});
