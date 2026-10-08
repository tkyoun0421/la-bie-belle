import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const openDayMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/features/scheduleDay/api/openDay.api", () => ({
  openDay: openDayMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useOpenDayMutation } =
  await import("@/features/scheduleDay/services/useOpenDayMutation");

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

const WORK_DATE = "2026-10-10";

beforeEach(() => {
  openDayMock.mockReset();
});

describe("useOpenDayMutation — open_day를 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, workDate)로 부르고 세 키를 무효화한다", async () => {
    openDayMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useOpenDayMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ workDate: WORK_DATE });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(openDayMock).toHaveBeenCalledWith(FAKE_CLIENT, WORK_DATE);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["schedule"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["payroll"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["requests"] }),
    );
  });

  it("이미 연 날이면 DomainError('already_open')를 그대로 error에 낸다", async () => {
    openDayMock.mockRejectedValue(new DomainError("already_open"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useOpenDayMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ workDate: WORK_DATE });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("already_open");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    openDayMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useOpenDayMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ workDate: WORK_DATE });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ workDate: "2026-10-11" });
    });

    expect(openDayMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
