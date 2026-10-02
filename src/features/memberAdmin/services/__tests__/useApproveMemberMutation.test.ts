import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 가입 승인이다(`docs/2-design/modules/account/screens/membersPending.md`의 「승인」).
// 앱 전체의 첫 문이라 이것이 지나야 근무표도 급여도 열린다.
// 성공하면 `design.md`의 「캐시 갱신」대로 `['members']`만 무효화한다. 늦게 누른 쪽은
// `already_decided`로 서버가 거절한다.

const approveMemberMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/memberAdmin/api/approveMember.api",
  () => ({
    approveMember: approveMemberMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useApproveMemberMutation } =
  await import("@/features/memberAdmin/services/useApproveMemberMutation");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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
  approveMemberMock.mockReset();
});

describe("useApproveMemberMutation — 가입을 승인하고 members를 무효화한다", () => {
  it("성공하면 DAL을 그 인자로 부르고 ['members']를 무효화한다", async () => {
    approveMemberMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useApproveMemberMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(approveMemberMock).toHaveBeenCalledWith(FAKE_CLIENT, "profile-1");
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["members"] }),
    );
  });

  it("늦게 누르면 DomainError('already_decided')를 그대로 error에 낸다", async () => {
    approveMemberMock.mockRejectedValue(new DomainError("already_decided"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApproveMemberMutation(FAKE_CLIENT), {
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
    approveMemberMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApproveMemberMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ profileId: "profile-1" });
    });

    expect(approveMemberMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
