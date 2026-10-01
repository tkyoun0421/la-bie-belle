import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/scheduleConfirm/hooks/useConfirmScheduleMutation.ts
//
// 달을 확정한다. `already_confirmed`는 관리자 둘이 같은 달을 확정했거나 재시도가 두 번
// 닿은 것이라 결과가 같으므로 이 훅이 성공으로 처리한다
// (`docs/3-build/plans/schedule-admin.md` 상태 격자 「동시 변경」, dal 자체는
// `confirm-schedule.integration.test.ts`가 이미 확인했듯 오류 모양 정규화만 한다).
// `too_early`처럼 다른 코드는 그대로 실패로 낸다. 캐시 갱신은 `['schedule']`
// `['payroll']` `['requests']`다.

const confirmScheduleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/scheduleConfirm/api/confirmSchedule.api",
  () => ({
    confirmSchedule: confirmScheduleMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useConfirmScheduleMutation } =
  await import("@/features/scheduleConfirm/hooks/useConfirmScheduleMutation");

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
  confirmScheduleMock.mockReset();
});

describe("useConfirmScheduleMutation — confirm_schedule을 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, month)로 부르고 세 키를 무효화한다", async () => {
    confirmScheduleMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useConfirmScheduleMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ month: MONTH });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(confirmScheduleMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
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

  it("마감 전에 부르면 DomainError('too_early')를 그대로 error에 낸다", async () => {
    confirmScheduleMock.mockRejectedValue(new DomainError("too_early"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useConfirmScheduleMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ month: MONTH });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("too_early");
  });

  it("already_confirmed는 실패가 아니라 성공으로 처리한다", async () => {
    confirmScheduleMock.mockRejectedValue(new DomainError("already_confirmed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useConfirmScheduleMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ month: MONTH });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isError).toBe(false);
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    confirmScheduleMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useConfirmScheduleMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ month: MONTH });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ month: MONTH });
    });

    expect(confirmScheduleMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
