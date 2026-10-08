import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const decideCancelRequestMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/workRequest/api/decideCancelRequest.api",
  () => ({
    decideCancelRequest: decideCancelRequestMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useDecideCancelRequestMutation } =
  await import("@/features/workRequest/services/useDecideCancelRequestMutation");

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

const CANCEL_REQUEST_ID = "cancel-request-1";

beforeEach(() => {
  decideCancelRequestMock.mockReset();
});

describe("useDecideCancelRequestMutation — decide_cancel_request를 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("승인은 cancelRequestId와 decision만 넘긴다", async () => {
    decideCancelRequestMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useDecideCancelRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({
        cancelRequestId: CANCEL_REQUEST_ID,
        decision: "approved",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(decideCancelRequestMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      CANCEL_REQUEST_ID,
      "approved",
      undefined,
    );
  });

  it("거절은 이유를 그대로 DAL에 넘긴다", async () => {
    decideCancelRequestMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useDecideCancelRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({
        cancelRequestId: CANCEL_REQUEST_ID,
        decision: "rejected",
        reason: "그날 대신 나올 사람이 없어요",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(decideCancelRequestMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      CANCEL_REQUEST_ID,
      "rejected",
      "그날 대신 나올 사람이 없어요",
    );
  });

  it("성공하면 schedule·payroll·requests를 무효화한다", async () => {
    decideCancelRequestMock.mockResolvedValue(undefined);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useDecideCancelRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({
        cancelRequestId: CANCEL_REQUEST_ID,
        decision: "approved",
      });
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

  it("둘이 동시에 판정하면 DomainError('already_decided')를 그대로 error에 낸다", async () => {
    decideCancelRequestMock.mockRejectedValue(
      new DomainError("already_decided"),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useDecideCancelRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({
        cancelRequestId: CANCEL_REQUEST_ID,
        decision: "approved",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("already_decided");
  });
});
