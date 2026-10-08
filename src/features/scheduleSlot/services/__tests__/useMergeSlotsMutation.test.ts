import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const mergeSlotsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/features/scheduleSlot/api/mergeSlots.api", () => ({
  mergeSlots: mergeSlotsMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useMergeSlotsMutation } =
  await import("@/features/scheduleSlot/services/useMergeSlotsMutation");

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

const DAY_ID = "day-1";
const FROM = "매니저";
const TO = "안내";

beforeEach(() => {
  mergeSlotsMock.mockReset();
});

describe("useMergeSlotsMutation — merge_slots를 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, dayId, from, to)로 부르고 세 키를 무효화한다", async () => {
    mergeSlotsMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMergeSlotsMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ dayId: DAY_ID, from: FROM, to: TO });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mergeSlotsMock).toHaveBeenCalledWith(FAKE_CLIENT, DAY_ID, FROM, TO);
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

  it("한쪽이라도 빈 자리가 없으면 DomainError('no_empty_slot')를 그대로 error에 낸다", async () => {
    mergeSlotsMock.mockRejectedValue(new DomainError("no_empty_slot"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMergeSlotsMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ dayId: DAY_ID, from: FROM, to: TO });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("no_empty_slot");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    mergeSlotsMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMergeSlotsMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ dayId: DAY_ID, from: FROM, to: TO });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ dayId: DAY_ID, from: "축가", to: TO });
    });

    expect(mergeSlotsMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
