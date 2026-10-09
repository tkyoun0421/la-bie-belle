import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const countUnreadNotificationsMock =
  jest.fn<(...args: unknown[]) => Promise<number>>();

jest.unstable_mockModule(
  "@/entities/notification/api/countUnreadNotifications.api",
  () => ({
    countUnreadNotifications: countUnreadNotificationsMock,
  }),
  { virtual: true },
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useUnreadCountSuspenseQuery } =
  await import("@/entities/notification/services/useUnreadCountSuspenseQuery");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(React.Suspense, { fallback: null }, children),
    );
  }

  return { wrapper, queryClient };
}

const FAKE_CLIENT = {} as never;

beforeEach(() => {
  countUnreadNotificationsMock.mockReset();
});

describe("useUnreadCountSuspenseQuery — 기다리는 일을 경계에 맡긴다", () => {
  it("다 받으면 수를 그대로 낸다", async () => {
    countUnreadNotificationsMock.mockResolvedValue(3);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useUnreadCountSuspenseQuery(FAKE_CLIENT),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBe(3));
  });

  it("`useUnreadCountQuery`와 같은 캐시 키를 쓴다", async () => {
    countUnreadNotificationsMock.mockResolvedValue(7);

    const { wrapper, queryClient } = createWrapper();
    const { queryKeys } = await import("@/shared/api/queryKeys");

    renderHook(() => useUnreadCountSuspenseQuery(FAKE_CLIENT), { wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryData(queryKeys.notification.unread())).toBe(7),
    );
  });

  it("아직 안 받았으면 `data`가 없는 상태를 내지 않는다", async () => {
    let release: (count: number) => void = () => {};

    countUnreadNotificationsMock.mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          release = resolve;
        }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useUnreadCountSuspenseQuery(FAKE_CLIENT),
      { wrapper },
    );

    expect(result.current).toBeNull();

    release(1);

    await waitFor(() => expect(result.current.data).toBe(1));
  });
});
