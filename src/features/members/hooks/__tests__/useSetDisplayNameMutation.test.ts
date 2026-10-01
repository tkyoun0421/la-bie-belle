import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 관리자가 직원 이름을 고친다(`docs/2-design/modules/account/screens/members.md`의
// 「이름 고치기」). 성공하면 지난 근무표·급여에도 그 이름이 뜨므로 `design.md`의
// 「캐시 갱신」대로 `['profile']` `['members']` `['schedule']` 셋을 무효화한다.

const setDisplayNameMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/features/members/api/setDisplayName.api", () => ({
  setDisplayName: setDisplayNameMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useSetDisplayNameMutation } =
  await import("@/features/members/hooks/useSetDisplayNameMutation");

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
  setDisplayNameMock.mockReset();
});

describe("useSetDisplayNameMutation — 이름을 바꾸고 profile·members·schedule을 무효화한다", () => {
  it("성공하면 DAL을 그 인자로 부르고 세 키를 무효화한다", async () => {
    setDisplayNameMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useSetDisplayNameMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ profileId: "profile-1", name: "박서영" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setDisplayNameMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      "profile-1",
      "박서영",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["profile"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["members"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["schedule"] }),
    );
  });

  it("실패하면 DomainError('invalid_name')를 그대로 error에 낸다", async () => {
    setDisplayNameMock.mockRejectedValue(new DomainError("invalid_name"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSetDisplayNameMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ profileId: "profile-1", name: "" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("invalid_name");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    setDisplayNameMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSetDisplayNameMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ profileId: "profile-1", name: "박서영" });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ profileId: "profile-1", name: "박서영" });
    });

    expect(setDisplayNameMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
