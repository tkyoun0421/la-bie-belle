import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const decideEntryMock = jest.fn<(...args: unknown[]) => Promise<string>>();

jest.unstable_mockModule("@/features/auth/lib/decideEntry.lib", () => ({
  decideEntry: decideEntryMock,
}));

const FAKE_CLIENT = {} as never;

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useRetryEntryMutation } =
  await import("@/features/auth/services/useRetryEntryMutation");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
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

beforeEach(() => {
  decideEntryMock.mockReset();
  decideEntryMock.mockResolvedValue("/");
});

describe("useRetryEntryMutation", () => {
  it("판정에 받은 클라이언트를 꽂아 부른다", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetryEntryMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => result.current.retry(() => {}));

    await waitFor(() =>
      expect(decideEntryMock).toHaveBeenCalledWith({ client: FAKE_CLIENT }),
    );
  });

  it("판정이 낸 자리를 그대로 넘긴다", async () => {
    decideEntryMock.mockResolvedValue("/admin");

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetryEntryMutation(FAKE_CLIENT), {
      wrapper,
    });

    const decided = jest.fn<(destination: string) => void>();

    act(() => result.current.retry(decided));

    await waitFor(() => expect(decided).toHaveBeenCalledWith("/admin"));
  });

  it("`/retry`가 나와도 걸러 내지 않는다", async () => {
    decideEntryMock.mockResolvedValue("/retry");

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetryEntryMutation(FAKE_CLIENT), {
      wrapper,
    });

    const decided = jest.fn<(destination: string) => void>();

    act(() => result.current.retry(decided));

    await waitFor(() => expect(decided).toHaveBeenCalledWith("/retry"));
  });

  it("도는 동안은 다시 안 보낸다", async () => {
    decideEntryMock.mockReturnValue(new Promise(() => {}));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetryEntryMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => result.current.retry(() => {}));

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => result.current.retry(() => {}));

    expect(decideEntryMock).toHaveBeenCalledTimes(1);
  });

  it("판정이 던지면 그 자리에서 끝난다", async () => {
    decideEntryMock.mockRejectedValue(new Error("끊겼다"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetryEntryMutation(FAKE_CLIENT), {
      wrapper,
    });

    const decided = jest.fn<(destination: string) => void>();

    act(() => result.current.retry(decided));

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(decided).not.toHaveBeenCalled();
  });
});
