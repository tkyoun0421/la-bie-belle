import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 퇴사 처리다(`docs/2-design/modules/account/screens/members.md`의 「퇴사 처리」).
// 성공하면 `design.md`의 「캐시 갱신」대로 `['members']`만 무효화한다. 앞 배정이 남았으면
// `has_future_assignments`, 마지막 관리자면 `last_admin`으로 서버가 거절한다([ACC-008]·
// [ACC-010]).

const markLeaveMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/profile/dals/markLeave", () => ({
  markLeave: markLeaveMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useMarkLeave } = await import("@/features/members/model/useMarkLeave");

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
  markLeaveMock.mockReset();
});

describe("useMarkLeave — 퇴사 처리하고 members를 무효화한다", () => {
  it("성공하면 DAL을 그 인자로 부르고 ['members']를 무효화한다", async () => {
    markLeaveMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMarkLeave(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(markLeaveMock).toHaveBeenCalledWith(FAKE_CLIENT, "profile-1");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["members"] }),
    );
  });

  it("앞 배정이 남았으면 DomainError('has_future_assignments')를 그대로 error에 낸다", async () => {
    markLeaveMock.mockRejectedValue(new DomainError("has_future_assignments"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMarkLeave(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("has_future_assignments");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    markLeaveMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMarkLeave(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    expect(markLeaveMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
