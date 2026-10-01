import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const countUnreadNotificationsMock =
  jest.fn<(...args: unknown[]) => Promise<number>>();

jest.unstable_mockModule(
  "@/entities/notification/dals/countUnreadNotifications",
  () => ({
    countUnreadNotifications: countUnreadNotificationsMock,
  }),
  { virtual: true },
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useUnreadCount } =
  await import("@/features/notification/model/useUnreadCount");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

beforeEach(() => {
  countUnreadNotificationsMock.mockReset();
});

describe("useUnreadCount — 캐시 키가 ['notifications', 'unread']다", () => {
  it("성공하면 그 키에 값이 앉는다", async () => {
    countUnreadNotificationsMock.mockResolvedValue(0);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useUnreadCount(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["notifications", "unread"])).toBe(0);
  });
});

describe("useUnreadCount — 안 읽은 것이 없으면 0이라 점이 없다", () => {
  it("data가 0이다", async () => {
    countUnreadNotificationsMock.mockResolvedValue(0);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUnreadCount(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBe(0);
  });
});

describe("useUnreadCount — 안 읽은 것이 하나 이상이면 점이 선다", () => {
  it("data가 1이면 그대로 1이다", async () => {
    countUnreadNotificationsMock.mockResolvedValue(1);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUnreadCount(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBe(1);
  });

  it("data가 12면 그대로 12다 — 수를 세지 않고 여부만 쓰지만 훅은 실수를 그대로 낸다", async () => {
    countUnreadNotificationsMock.mockResolvedValue(12);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUnreadCount(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBe(12);
  });
});
