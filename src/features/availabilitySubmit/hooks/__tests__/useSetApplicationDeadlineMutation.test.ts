import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/availabilitySubmit/hooks/useSetApplicationDeadlineMutation.ts
//
// 마감일을 바꾼다. 근무 신청 모아보기의 「마감일 바꾸기」와 확정 잠김의 「마감일 당기기」가
// 같은 훅을 쓴다(`schedule-admin.md`의 「근무 신청 모아보기 짜임」). 캐시 갱신은
// design.md 「근무표 만들기와 마감일」 행 그대로 `['schedule']` `['payroll']`
// `['requests']`다.

const setApplicationDeadlineMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/availabilitySubmit/api/setApplicationDeadline.api",
  () => ({
    setApplicationDeadline: setApplicationDeadlineMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useSetApplicationDeadlineMutation } =
  await import("@/features/availabilitySubmit/hooks/useSetApplicationDeadlineMutation");

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

const DEADLINE = "2026-10-09";

beforeEach(() => {
  setApplicationDeadlineMock.mockReset();
});

describe("useSetApplicationDeadlineMutation — set_application_deadline을 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, month, deadline)로 부르고 세 키를 무효화한다", async () => {
    setApplicationDeadlineMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useSetApplicationDeadlineMutation(FAKE_CLIENT),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ month: MONTH, deadline: DEADLINE });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setApplicationDeadlineMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      MONTH,
      DEADLINE,
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

  it("그 달 근무표가 없으면 DomainError('no_schedule')를 그대로 error에 낸다", async () => {
    setApplicationDeadlineMock.mockRejectedValue(
      new DomainError("no_schedule"),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSetApplicationDeadlineMutation(FAKE_CLIENT),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ month: MONTH, deadline: DEADLINE });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("no_schedule");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    setApplicationDeadlineMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSetApplicationDeadlineMutation(FAKE_CLIENT),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ month: MONTH, deadline: DEADLINE });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ month: MONTH, deadline: DEADLINE });
    });

    expect(setApplicationDeadlineMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
