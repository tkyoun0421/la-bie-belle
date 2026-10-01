import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 관리자로 올리고 내린다(`docs/2-design/modules/account/screens/members.md`의
// 「관리자로 올리기와 내리기」). 성공하면 `design.md`의 「캐시 갱신」대로 `['members']`만
// 무효화한다. 마지막 관리자를 내리면 서버가 `last_admin`으로 거절한다([ACC-008]).

const setRoleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/profile/api/setRole.api", () => ({
  setRole: setRoleMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useSetRole } = await import("@/features/members/model/useSetRole");

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
  setRoleMock.mockReset();
});

describe("useSetRole — 역할을 바꾸고 members를 무효화한다", () => {
  it("성공하면 DAL을 그 인자로 부르고 ['members']를 무효화한다", async () => {
    setRoleMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSetRole(FAKE_CLIENT), { wrapper });

    act(() => {
      result.current.mutate({ profileId: "profile-1", role: "admin" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setRoleMock).toHaveBeenCalledWith(FAKE_CLIENT, "profile-1", "admin");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["members"] }),
    );
  });

  it("마지막 관리자를 내리면 DomainError('last_admin')를 그대로 error에 낸다", async () => {
    setRoleMock.mockRejectedValue(new DomainError("last_admin"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSetRole(FAKE_CLIENT), { wrapper });

    act(() => {
      result.current.mutate({ profileId: "profile-1", role: "worker" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("last_admin");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    setRoleMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSetRole(FAKE_CLIENT), { wrapper });

    act(() => {
      result.current.mutate({ profileId: "profile-1", role: "admin" });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ profileId: "profile-1", role: "admin" });
    });

    expect(setRoleMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
