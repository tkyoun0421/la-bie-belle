import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/workRequest/hooks/useCreateCancelRequestMutation.ts
//
// 근무자가 근무 취소를 요청한다(`createCancelRequest.ts`의
// `createCancelRequest(client, assignmentId, reason)`). 성공하면
// `['schedule']`·`['payroll']`·`['requests']`를 무효화한다(design.md 「근무 취소 요청과
// 판정」).

const createCancelRequestMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/workRequest/api/createCancelRequest.api",
  () => ({
    createCancelRequest: createCancelRequestMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useCreateCancelRequestMutation } =
  await import("@/features/workRequest/hooks/useCreateCancelRequestMutation");

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
const REASON = "그날 다른 일정이 생겼어요";

beforeEach(() => {
  createCancelRequestMock.mockReset();
});

describe("useCreateCancelRequestMutation — create_cancel_request를 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("assignmentId와 reason을 그대로 DAL에 넘긴다", async () => {
    createCancelRequestMock.mockResolvedValue("cancel-request-1");
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useCreateCancelRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ assignmentId: ASSIGNMENT_ID, reason: REASON });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createCancelRequestMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      ASSIGNMENT_ID,
      REASON,
    );
  });

  it("성공하면 schedule·payroll·requests를 무효화한다", async () => {
    createCancelRequestMock.mockResolvedValue("cancel-request-1");
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useCreateCancelRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ assignmentId: ASSIGNMENT_ID, reason: REASON });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

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

  it("근무 당일부터는 DomainError('window_closed')를 그대로 error에 낸다", async () => {
    createCancelRequestMock.mockRejectedValue(new DomainError("window_closed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useCreateCancelRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ assignmentId: ASSIGNMENT_ID, reason: REASON });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("window_closed");
  });
});
