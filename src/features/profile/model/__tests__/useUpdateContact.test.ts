import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 연락처 저장은 응답 대기다 — 낙관적 onMutate·롤백이 없고 isPending으로 버튼만 잠근다.
// 정본은 `docs/2-design/system/runtime.md`의 「낙관적 업데이트」와
// `docs/2-design/modules/account/design.md`의 「프로필 제출·연락처·사진」이다.
// 성공하면 `['profile','private']`을 무효화한다.

const updateMyContactMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/profile/dals/update-my-contact", () => ({
  updateMyContact: updateMyContactMock,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useUpdateContact } =
  await import("@/features/profile/model/useUpdateContact");

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
  updateMyContactMock.mockReset();
});

describe("useUpdateContact — 응답을 기다리고 성공하면 private을 무효화한다", () => {
  it("성공하면 DAL을 그 인자로 부르고 ['profile','private']을 무효화한다", async () => {
    updateMyContactMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateContact(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        profileId: "profile-1",
        phone: "010-0000-0009",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateMyContactMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      "profile-1",
      "010-0000-0009",
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["profile", "private"] }),
    );
  });

  it("실패하면 DomainError('invalid_phone')를 그대로 error에 낸다", async () => {
    updateMyContactMock.mockRejectedValue(new DomainError("invalid_phone"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateContact(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        profileId: "profile-1",
        phone: "010-0000-0009",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("invalid_phone");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    updateMyContactMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateContact(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        profileId: "profile-1",
        phone: "010-0000-0009",
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({
        profileId: "profile-1",
        phone: "010-0000-0009",
      });
    });

    expect(updateMyContactMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
