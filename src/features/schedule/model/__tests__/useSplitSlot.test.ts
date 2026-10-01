import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/schedule/model/useSplitSlot.ts
//
// 겸임 자리를 나눈다. `splitSlot(client, slotId)`를 부르고 배정된 사람은 받은 쪽에 그대로
// 남는다(design.md 「날과 자리」). 캐시 갱신은 `['schedule']` `['payroll']` `['requests']`다.

const splitSlotMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/schedule/dals/splitSlot", () => ({
  splitSlot: splitSlotMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useSplitSlot } = await import("@/features/schedule/model/useSplitSlot");

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

const SLOT_ID = "slot-merged-1";

beforeEach(() => {
  splitSlotMock.mockReset();
});

describe("useSplitSlot — split_slot을 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, slotId)로 부르고 세 키를 무효화한다", async () => {
    splitSlotMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSplitSlot(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ slotId: SLOT_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(splitSlotMock).toHaveBeenCalledWith(FAKE_CLIENT, SLOT_ID);
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

  it("겸임 자리가 아니면 DomainError('not_merged')를 그대로 error에 낸다", async () => {
    splitSlotMock.mockRejectedValue(new DomainError("not_merged"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSplitSlot(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ slotId: SLOT_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("not_merged");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    splitSlotMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSplitSlot(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ slotId: SLOT_ID });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ slotId: "slot-merged-2" });
    });

    expect(splitSlotMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
