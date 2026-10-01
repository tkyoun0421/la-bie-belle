import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/schedule/model/useAddSlot.ts
//
// 잠금이 풀린 포지션의 「자리 추가」다. `addSlot(client, dayId, position)`을 부르고
// 자리 늘리기·줄이기·겸임 셋과 같은 캐시 갱신 — `['schedule']` `['payroll']` `['requests']`다
// (design.md 「자리 늘리기·줄이기·겸임」).

const addSlotMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/schedule/dals/addSlot", () => ({
  addSlot: addSlotMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useAddSlot } = await import("@/features/schedule/model/useAddSlot");

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
const POSITION = "안내";

beforeEach(() => {
  addSlotMock.mockReset();
});

describe("useAddSlot — add_slot을 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, dayId, position)으로 부르고 세 키를 무효화한다", async () => {
    addSlotMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAddSlot(FAKE_CLIENT), { wrapper });

    act(() => {
      result.current.mutate({ dayId: DAY_ID, position: POSITION });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(addSlotMock).toHaveBeenCalledWith(FAKE_CLIENT, DAY_ID, POSITION);
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
    addSlotMock.mockRejectedValue(new DomainError("already_confirmed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddSlot(FAKE_CLIENT), { wrapper });

    act(() => {
      result.current.mutate({ dayId: DAY_ID, position: POSITION });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("already_confirmed");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    addSlotMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddSlot(FAKE_CLIENT), { wrapper });

    act(() => {
      result.current.mutate({ dayId: DAY_ID, position: POSITION });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ dayId: DAY_ID, position: "스캔" });
    });

    expect(addSlotMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
