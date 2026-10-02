import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const markNotificationsReadMock =
  jest.fn<(...args: unknown[]) => Promise<void>>();

jest.unstable_mockModule(
  "@/features/notificationRead/api/markNotificationsRead.api",
  () => ({
    markNotificationsRead: markNotificationsReadMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useMarkNotificationsReadMutation } =
  await import("@/features/notificationRead/services/useMarkNotificationsReadMutation");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
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
const IDS = ["notif-1", "notif-2"];

beforeEach(() => {
  markNotificationsReadMock.mockReset();
});

describe("useMarkNotificationsReadMutation — markNotificationsRead를 그 인자로 부른다", () => {
  it("mutate에 넣은 ids 그대로 DAL을 부른다", async () => {
    markNotificationsReadMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMarkNotificationsReadMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate(IDS);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(markNotificationsReadMock).toHaveBeenCalledWith(FAKE_CLIENT, IDS);
  });
});

describe("useMarkNotificationsReadMutation — 성공하면 ['notifications']와 ['notifications', 'unread'] 둘 다 무효화한다", () => {
  it("두 키가 전부 invalidateQueries에 실린다", async () => {
    markNotificationsReadMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useMarkNotificationsReadMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate(IDS);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["notifications"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["notifications", "unread"] }),
    );
  });
});

describe("useMarkNotificationsReadMutation — DAL이 실패하면 error에 그대로 싣는다", () => {
  it("실패가 삼켜지지 않고 error가 선다", async () => {
    markNotificationsReadMock.mockRejectedValue(new Error("네트워크가 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useMarkNotificationsReadMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate(IDS);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
