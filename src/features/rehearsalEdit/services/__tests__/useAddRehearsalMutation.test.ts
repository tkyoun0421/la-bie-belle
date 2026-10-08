import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const addRehearsalMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/rehearsalEdit/api/addRehearsal.api",
  () => ({
    addRehearsal: addRehearsalMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useAddRehearsalMutation } =
  await import("@/features/rehearsalEdit/services/useAddRehearsalMutation");

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

const TIME_INPUT = {
  workDate: "2026-10-08",
  startsAt: "14:00",
  endsAt: "16:00",
};

beforeEach(() => {
  addRehearsalMock.mockReset();
});

describe("useAddRehearsalMutation — add_rehearsal을 부르고 rehearsal·payroll을 무효화한다", () => {
  it("입력을 그대로 DAL에 넘긴다", async () => {
    addRehearsalMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddRehearsalMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(TIME_INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(addRehearsalMock).toHaveBeenCalledWith(FAKE_CLIENT, TIME_INPUT);
  });

  it("성공하면 ['rehearsal']과 ['payroll']을 무효화하고 ['schedule']은 안 건드린다", async () => {
    addRehearsalMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAddRehearsalMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(TIME_INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["rehearsal"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["payroll"] }),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["schedule"] }),
    );
  });

  it("wrong_kind면 DomainError를 그대로 error에 낸다", async () => {
    addRehearsalMock.mockRejectedValue(new DomainError("wrong_kind"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddRehearsalMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(TIME_INPUT);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("wrong_kind");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    addRehearsalMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAddRehearsalMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(TIME_INPUT);
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ workDate: "2026-10-09", count: 2 });
    });

    expect(addRehearsalMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
