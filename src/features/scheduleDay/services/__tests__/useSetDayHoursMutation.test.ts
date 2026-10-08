import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const setDayHoursMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/features/scheduleDay/api/setDayHours.api", () => ({
  setDayHours: setDayHoursMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useSetDayHoursMutation } =
  await import("@/features/scheduleDay/services/useSetDayHoursMutation");

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
  setDayHoursMock.mockReset();
});

describe("useSetDayHoursMutation — set_day_hours를 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, workDate, starts, ends)로 부르고 세 키를 무효화한다", async () => {
    setDayHoursMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSetDayHoursMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        workDate: WORK_DATE,
        starts: "09:00",
        ends: "23:00",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setDayHoursMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      WORK_DATE,
      "09:00",
      "23:00",
    );
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

  it("끝이 시작보다 이르면 DomainError('bad_hours')를 그대로 error에 낸다", async () => {
    setDayHoursMock.mockRejectedValue(new DomainError("bad_hours"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSetDayHoursMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        workDate: WORK_DATE,
        starts: "22:00",
        ends: "10:00",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("bad_hours");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    setDayHoursMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSetDayHoursMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        workDate: WORK_DATE,
        starts: "09:00",
        ends: "23:00",
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({
        workDate: WORK_DATE,
        starts: "10:00",
        ends: "22:00",
      });
    });

    expect(setDayHoursMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
