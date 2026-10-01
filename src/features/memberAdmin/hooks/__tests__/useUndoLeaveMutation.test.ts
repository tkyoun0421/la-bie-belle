import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 퇴사 되돌리기다(`docs/2-design/modules/account/screens/members.md`의 「되돌리기」).
// 성공하면 `design.md`의 「캐시 갱신」대로 `['members']`만 무효화한다. 퇴사 아닌 대상이면
// 도메인 거절 코드를 안 늘려 `already_decided`로 거절한다(총괄이 정한 것 1).

const undoLeaveMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/features/memberAdmin/api/undoLeave.api", () => ({
  undoLeave: undoLeaveMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useUndoLeaveMutation } =
  await import("@/features/memberAdmin/hooks/useUndoLeaveMutation");

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

beforeEach(() => {
  undoLeaveMock.mockReset();
});

describe("useUndoLeaveMutation — 퇴사를 되돌리고 members를 무효화한다", () => {
  it("성공하면 DAL을 그 인자로 부르고 ['members']를 무효화한다", async () => {
    undoLeaveMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUndoLeaveMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(undoLeaveMock).toHaveBeenCalledWith(FAKE_CLIENT, "profile-1");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["members"] }),
    );
  });

  it("퇴사 아닌 대상이면 DomainError('already_decided')를 그대로 error에 낸다", async () => {
    undoLeaveMock.mockRejectedValue(new DomainError("already_decided"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUndoLeaveMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("already_decided");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    undoLeaveMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUndoLeaveMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    expect(undoLeaveMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
