import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const submitAvailabilityMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/schedule/dals/submitAvailability", () => ({
  submitAvailability: submitAvailabilityMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useSubmitAvailability } =
  await import("@/features/schedule/model/useSubmitAvailability");

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

const MONTH = "2026-10";

beforeEach(() => {
  submitAvailabilityMock.mockReset();
});

describe("useSubmitAvailability — 그 달 신청을 보내고 availability를 무효화한다", () => {
  it("성공하면 DAL을 그 인자로 부르고 ['availability']를 무효화한다", async () => {
    submitAvailabilityMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSubmitAvailability(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ month: MONTH, dates: ["2026-10-10"] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(submitAvailabilityMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH, [
      "2026-10-10",
    ]);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["availability"] }),
    );
  });

  it("빈 배열도 그대로 보낸다 — 0개로 이미 낸 신청을 무른다", async () => {
    submitAvailabilityMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSubmitAvailability(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ month: MONTH, dates: [] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(submitAvailabilityMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH, []);
  });

  it("마감이 지나면 DomainError('window_closed')를 그대로 error에 낸다", async () => {
    submitAvailabilityMock.mockRejectedValue(new DomainError("window_closed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSubmitAvailability(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ month: MONTH, dates: ["2026-10-10"] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("window_closed");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    submitAvailabilityMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSubmitAvailability(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ month: MONTH, dates: ["2026-10-10"] });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ month: MONTH, dates: ["2026-10-17"] });
    });

    expect(submitAvailabilityMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
