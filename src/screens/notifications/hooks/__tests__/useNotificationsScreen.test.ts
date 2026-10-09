import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const markNotificationsReadMock =
  jest.fn<(...args: unknown[]) => Promise<void>>();

const FIXED_NOW_MS = Date.UTC(2026, 9, 3, 1, 0, 0);

jest.unstable_mockModule(
  "@/features/notificationRead/api/markNotificationsRead.api",
  () => ({ markNotificationsRead: markNotificationsReadMock }),
);

const clockPolicy = await import("@/entities/clock/model/serverClock.policy");

jest.unstable_mockModule("@/entities/clock/model/serverClock.policy", () => ({
  ...clockPolicy,
  nowWithOffset: () => FIXED_NOW_MS,
}));

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

function mounted(from?: string) {
  const { wrapper } = createWrapper();

  return renderHook(() => useNotificationsScreen(from), { wrapper });
}

beforeEach(() => {
  markNotificationsReadMock.mockReset();
  backMock.mockClear();
  replaceMock.mockClear();
  pushMock.mockClear();
  canGoBackMock.mockReset();

  canGoBackMock.mockReturnValue(true);
  markNotificationsReadMock.mockResolvedValue(undefined);
});

describe("useNotificationsScreen — 조각이 고른 줄을 보내고 읽음을 찍는다", () => {
  it("서버 시계로 선 지금을 조각에 건넨다", () => {
    const { result } = mounted();

    expect(result.current.now.getTime()).toBe(FIXED_NOW_MS);
  });

  it("줄을 누르면 먼저 보내고 읽음을 찍는다", async () => {
    const { result } = mounted();

    act(() => result.current.pressRow({ ids: ["a"], destination: "/to/a" }));

    expect(pushMock).toHaveBeenCalledWith("/to/a");

    await waitFor(() =>
      expect(markNotificationsReadMock).toHaveBeenCalledWith(FAKE_CLIENT, [
        "a",
      ]),
    );
  });

  it("읽음이 넘어져도 조용하다 — 이미 다른 화면이다", async () => {
    markNotificationsReadMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.pressRow({ ids: ["a"], destination: "/to/a" }));

    await waitFor(() =>
      expect(markNotificationsReadMock).toHaveBeenCalledTimes(1),
    );

    expect(pushMock).toHaveBeenCalledWith("/to/a");
  });

  it("안 읽은 관리자 공지는 들어오는 것으로 찍힌다 — 안 눌러도 보낸다", async () => {
    const { result } = mounted();

    act(() => result.current.markNotices(["notice"]));

    await waitFor(() =>
      expect(markNotificationsReadMock).toHaveBeenCalledWith(FAKE_CLIENT, [
        "notice",
      ]),
    );
  });

  it("뒤로가 있으면 뒤로 가고 없으면 받은 자리로 바꾼다", () => {
    canGoBackMock.mockReturnValue(true);

    const { result } = mounted("/admin");

    act(() => result.current.goBack());

    expect(backMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("뒤로가 없고 받은 자리도 없으면 뿌리로 간다", () => {
    canGoBackMock.mockReturnValue(false);

    const { result } = mounted();

    act(() => result.current.goBack());

    expect(replaceMock).toHaveBeenCalledWith("/");
  });
});
