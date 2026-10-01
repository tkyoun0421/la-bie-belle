import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/schedule/model/useRemoveAssignment.ts
//
// 「자리 비우기」 · 강제 변경의 「사람 빼기」다. `removeAssignment(client, assignmentId)`를
// 부른다 — 확정 전이면 행이 지워지고 확정 뒤면 `ended_at`이 찍히는 갈림은 함수 안에서
// 난다(design.md 「배정과 강제 변경」). 캐시 갱신은 `['schedule']` `['payroll']`
// `['requests']`다.

const removeAssignmentMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/schedule/api/removeAssignment.api",
  () => ({
    removeAssignment: removeAssignmentMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useRemoveAssignment } =
  await import("@/features/schedule/model/useRemoveAssignment");

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

beforeEach(() => {
  removeAssignmentMock.mockReset();
});

describe("useRemoveAssignment — remove_assignment을 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("성공하면 DAL을 (client, assignmentId)로 부르고 세 키를 무효화한다", async () => {
    removeAssignmentMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRemoveAssignment(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ assignmentId: ASSIGNMENT_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(removeAssignmentMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      ASSIGNMENT_ID,
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

  it("이미 닫힌 배정을 다시 부르면 DomainError('stale')를 그대로 error에 낸다", async () => {
    removeAssignmentMock.mockRejectedValue(new DomainError("stale"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRemoveAssignment(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ assignmentId: ASSIGNMENT_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("stale");
  });

  it("isPending인 동안 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    removeAssignmentMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRemoveAssignment(FAKE_CLIENT), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ assignmentId: ASSIGNMENT_ID });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ assignmentId: "assignment-2" });
    });

    expect(removeAssignmentMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
