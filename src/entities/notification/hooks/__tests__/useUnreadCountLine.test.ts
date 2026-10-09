import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const countUnreadNotificationsMock =
  jest.fn<(...args: unknown[]) => Promise<number>>();

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: {} as never,
}));

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
const { useUnreadCountLine } =
  await import("@/entities/notification/hooks/useUnreadCountLine");

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

  return { wrapper };
}

beforeEach(() => {
  countUnreadNotificationsMock.mockReset();
});

describe("useUnreadCountLine — 조각이 자기 값을 완성해 든다", () => {
  it("받은 수를 문안으로 낸다", async () => {
    countUnreadNotificationsMock.mockResolvedValue(5);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnreadCountLine(), { wrapper });

    await waitFor(() => expect(result.current.line).toBe("안 읽은 알림 5개"));
  });

  it("다 읽었으면 수를 말하지 않는다", async () => {
    countUnreadNotificationsMock.mockResolvedValue(0);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnreadCountLine(), { wrapper });

    await waitFor(() => expect(result.current.line).toBe("다 읽었어요"));
  });

  it("기다리는 상태를 자기가 들지 않는다", async () => {
    let release: (count: number) => void = () => {};

    countUnreadNotificationsMock.mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          release = resolve;
        }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnreadCountLine(), { wrapper });

    expect(result.current).toBeNull();

    release(2);

    await waitFor(() => expect(result.current.line).toBe("안 읽은 알림 2개"));
  });
});
