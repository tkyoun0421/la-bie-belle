import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const createScheduleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/scheduleDay/api/createSchedule.api",
  () => ({
    createSchedule: createScheduleMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useCreateScheduleMutation } =
  await import("@/features/scheduleDay/services/useCreateScheduleMutation");

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

const DEADLINE = "2026-10-02";

beforeEach(() => {
  createScheduleMock.mockReset();
});

describe("useCreateScheduleMutation — create_schedule을 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, month, deadline)로 부르고 세 키를 무효화한다", async () => {
    createScheduleMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useCreateScheduleMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ month: MONTH, deadline: DEADLINE });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createScheduleMock).toHaveBeenCalledWith(
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

  it("같은 달을 두 번 만들면 DomainError('already_exists')를 그대로 error에 낸다", async () => {
    createScheduleMock.mockRejectedValue(new DomainError("already_exists"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useCreateScheduleMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ month: MONTH, deadline: DEADLINE });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("already_exists");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    createScheduleMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useCreateScheduleMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ month: MONTH, deadline: DEADLINE });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ month: MONTH, deadline: DEADLINE });
    });

    expect(createScheduleMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
