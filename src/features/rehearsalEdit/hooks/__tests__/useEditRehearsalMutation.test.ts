import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/rehearsal/hooks/useEditRehearsalMutation.ts
//
// 리허설 고치기다(design.md 「리허설 넣기·고치기·지우기」) — 성공하면 ['rehearsal']과
// ['payroll']을 무효화한다. **['schedule']은 안 건드린다.**

const editRehearsalMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/rehearsalEdit/api/editRehearsal.api",
  () => ({
    editRehearsal: editRehearsalMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useEditRehearsalMutation } =
  await import("@/features/rehearsalEdit/hooks/useEditRehearsalMutation");

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

const EDIT_INPUT = { id: "row-1", startsAt: "14:00", endsAt: "17:00" };

beforeEach(() => {
  editRehearsalMock.mockReset();
});

describe("useEditRehearsalMutation — edit_rehearsal을 부르고 rehearsal·payroll을 무효화한다", () => {
  it("입력을 그대로 DAL에 넘긴다", async () => {
    editRehearsalMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useEditRehearsalMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(EDIT_INPUT);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(editRehearsalMock).toHaveBeenCalledWith(FAKE_CLIENT, EDIT_INPUT);
  });

  it("성공하면 ['rehearsal']과 ['payroll']을 무효화하고 ['schedule']은 안 건드린다", async () => {
    editRehearsalMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useEditRehearsalMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(EDIT_INPUT);
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

  it("남의 행이면 DomainError('not_allowed')를 그대로 error에 낸다", async () => {
    editRehearsalMock.mockRejectedValue(new DomainError("not_allowed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useEditRehearsalMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(EDIT_INPUT);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("not_allowed");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    editRehearsalMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useEditRehearsalMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate(EDIT_INPUT);
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ id: "row-2", count: 3 });
    });

    expect(editRehearsalMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
