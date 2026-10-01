import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/schedule/hooks/useRemoveSlotMutation.ts
//
// 잠금이 풀린 포지션에서 자리를 버리는 손짓의 서버 쪽이다. `removeSlot(client, slotId)`를
// 부르고 자리 늘리기·줄이기·겸임 셋과 같은 캐시 갱신 — `['schedule']` `['payroll']`
// `['requests']`다(design.md 「자리 늘리기·줄이기·겸임」). 빈 자리와 사람 든 자리를 가르는
// 확인 시트 판정은 `screens/scheduleAdmin/model/discardSlot.ts`의 몫이라 이 훅은 안 본다.

const removeSlotMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/features/schedule/api/removeSlot.api", () => ({
  removeSlot: removeSlotMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useRemoveSlotMutation } =
  await import("@/features/schedule/hooks/useRemoveSlotMutation");

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

const SLOT_ID = "slot-1";

beforeEach(() => {
  removeSlotMock.mockReset();
});

describe("useRemoveSlotMutation — remove_slot을 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, slotId)로 부르고 세 키를 무효화한다", async () => {
    removeSlotMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRemoveSlotMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ slotId: SLOT_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(removeSlotMock).toHaveBeenCalledWith(FAKE_CLIENT, SLOT_ID);
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

  it("확정 시점에 있던 날이면 DomainError('already_confirmed')를 그대로 error에 낸다", async () => {
    removeSlotMock.mockRejectedValue(new DomainError("already_confirmed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRemoveSlotMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ slotId: SLOT_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("already_confirmed");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    removeSlotMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRemoveSlotMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ slotId: SLOT_ID });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ slotId: "slot-2" });
    });

    expect(removeSlotMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
