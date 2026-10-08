import { jest } from "@jest/globals";
import type { ReactNode } from "react";

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
const { DomainError } = await import("@/shared/model/error.type");
const { useForceChangeMutation } =
  await import("@/features/scheduleConfirm/services/useForceChangeMutation");

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
