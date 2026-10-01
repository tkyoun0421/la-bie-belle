import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/qualificationGrant/hooks/useGrantPositionMutation.ts
//
// 자격 없는 사람 시트의 「자격도 주기」다. `grantPosition(client, profileId, position)`을
// 부른다. 이 훅만 `['schedule']`이 아니라 `['members']`를 무효화한다(design.md 「자격
// 주기」 — 「캐시 갱신: ['members']」). `qualifications` 뷰가 `position_grants`를 읽으므로
// 픽커의 자격 판정도 이 무효화가 덮는다.

const grantPositionMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/qualificationGrant/api/grantPosition.api",
  () => ({
    grantPosition: grantPositionMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useGrantPositionMutation } =
  await import("@/features/qualificationGrant/hooks/useGrantPositionMutation");

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

const PROFILE_ID = "profile-1";
const POSITION = "스캔";

beforeEach(() => {
  grantPositionMock.mockReset();
});

describe("useGrantPositionMutation — grant_position을 부르고 members를 무효화한다", () => {
  it("성공하면 DAL을 (client, profileId, position)으로 부르고 members를 무효화한다", async () => {
    grantPositionMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useGrantPositionMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: PROFILE_ID, position: POSITION });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(grantPositionMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      PROFILE_ID,
      POSITION,
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["members"] }),
    );
  });

  it("schedule·payroll·requests는 무효화하지 않는다", async () => {
    grantPositionMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useGrantPositionMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: PROFILE_ID, position: POSITION });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([arg]) => (arg as { queryKey: unknown[] }).queryKey[0],
    );

    expect(invalidatedKeys).not.toContain("schedule");
    expect(invalidatedKeys).not.toContain("payroll");
    expect(invalidatedKeys).not.toContain("requests");
  });

  it("승인 안 된 세션이면 DomainError('not_allowed')를 그대로 error에 낸다", async () => {
    grantPositionMock.mockRejectedValue(new DomainError("not_allowed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGrantPositionMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: PROFILE_ID, position: POSITION });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("not_allowed");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    grantPositionMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGrantPositionMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ profileId: PROFILE_ID, position: POSITION });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ profileId: "profile-2", position: POSITION });
    });

    expect(grantPositionMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
