import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/schedule/hooks/useForceChangeMutation.ts
//
// 확정 뒤 「사람 바꾸기」다. `forceChange(client, assignmentId, profileId)`가 한
// 트랜잭션으로 옛 배정을 닫고 새 배정을 연다(design.md 「배정과 강제 변경」 — 「한
// 트랜잭션이다」). 새 사람에게 `add_assignment`와 같은 검사 넷이 걸린다. 캐시 갱신은
// `['schedule']` `['payroll']` `['requests']`다.

const forceChangeMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/scheduleConfirm/api/forceChange.api",
  () => ({
    forceChange: forceChangeMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useForceChangeMutation } =
  await import("@/features/scheduleConfirm/hooks/useForceChangeMutation");

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

const ASSIGNMENT_ID = "assignment-1";
const PROFILE_ID = "profile-2";

beforeEach(() => {
  forceChangeMock.mockReset();
});

describe("useForceChangeMutation — force_change를 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, assignmentId, profileId)로 부르고 세 키를 무효화한다", async () => {
    forceChangeMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useForceChangeMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        assignmentId: ASSIGNMENT_ID,
        profileId: PROFILE_ID,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(forceChangeMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      ASSIGNMENT_ID,
      PROFILE_ID,
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

  it("새 사람이 그날 신청 안 했으면 DomainError('not_applied')를 그대로 error에 낸다", async () => {
    forceChangeMock.mockRejectedValue(new DomainError("not_applied"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useForceChangeMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        assignmentId: ASSIGNMENT_ID,
        profileId: PROFILE_ID,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("not_applied");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    forceChangeMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useForceChangeMutation(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        assignmentId: ASSIGNMENT_ID,
        profileId: PROFILE_ID,
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({
        assignmentId: ASSIGNMENT_ID,
        profileId: "profile-3",
      });
    });

    expect(forceChangeMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
