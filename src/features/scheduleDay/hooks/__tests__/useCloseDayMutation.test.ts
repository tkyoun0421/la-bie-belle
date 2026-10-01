import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/scheduleDay/hooks/useCloseDayMutation.ts
//
// 날 하나를 닫는다. 배정이 있으면 화면이 먼저 경고 시트로 확인받고 이 훅은 그 뒤에
// `close_day`만 부른다(`schedule-admin.md`의 「날 닫기 경고」). 캐시 갱신은
// `['schedule']` `['payroll']` `['requests']`다.

const closeDayMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/features/scheduleDay/api/closeDay.api", () => ({
  closeDay: closeDayMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useCloseDayMutation } =
  await import("@/features/scheduleDay/hooks/useCloseDayMutation");

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
  closeDayMock.mockReset();
});

describe("useCloseDayMutation — close_day를 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, workDate)로 부르고 세 키를 무효화한다", async () => {
    closeDayMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCloseDayMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ workDate: WORK_DATE });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(closeDayMock).toHaveBeenCalledWith(FAKE_CLIENT, WORK_DATE);
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

  it("안 연 날짜를 닫으면 DomainError('not_open')를 그대로 error에 낸다", async () => {
    closeDayMock.mockRejectedValue(new DomainError("not_open"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCloseDayMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ workDate: WORK_DATE });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("not_open");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    closeDayMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCloseDayMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ workDate: WORK_DATE });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ workDate: WORK_DATE });
    });

    expect(closeDayMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
