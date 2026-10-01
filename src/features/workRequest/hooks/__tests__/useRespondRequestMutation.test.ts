import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/workRequest/hooks/useRespondRequestMutation.ts
//
// 근무자가 근무 요청에 답한다(`respondRequest.ts`의
// `respondRequest(client, requestId, answer)` — answer는 'accept'·'decline'). 성공하면
// `['schedule']`·`['payroll']`·`['requests']`를 무효화한다(design.md 「요청에 답하기」).
// AC-09는 응답을 기다리라고 정했다 — 보내는 동안 버튼 둘이 잠긴다.

const respondRequestMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/workRequest/api/respondRequest.api",
  () => ({
    respondRequest: respondRequestMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/model/error.type");
const { useRespondRequestMutation } =
  await import("@/features/workRequest/hooks/useRespondRequestMutation");

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

const REQUEST_ID = "request-1";

beforeEach(() => {
  respondRequestMock.mockReset();
});

describe("useRespondRequestMutation — respond_request를 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("requestId와 answer를 그대로 DAL에 넘긴다", async () => {
    respondRequestMock.mockResolvedValue("assignment-1");
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useRespondRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ requestId: REQUEST_ID, answer: "accept" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(respondRequestMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      REQUEST_ID,
      "accept",
    );
  });

  it("거절도 그대로 DAL에 넘긴다", async () => {
    respondRequestMock.mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useRespondRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ requestId: REQUEST_ID, answer: "decline" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(respondRequestMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      REQUEST_ID,
      "decline",
    );
  });

  it("성공하면 schedule·payroll·requests를 무효화한다", async () => {
    respondRequestMock.mockResolvedValue("assignment-1");
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useRespondRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ requestId: REQUEST_ID, answer: "accept" });
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

  it("늦은 수락은 DomainError('slot_full')를 그대로 error에 낸다", async () => {
    respondRequestMock.mockRejectedValue(new DomainError("slot_full"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useRespondRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ requestId: REQUEST_ID, answer: "accept" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("slot_full");
  });

  it("보내는 동안(isPending)에는 다시 mutate를 불러도 DAL을 다시 부르지 않는다", async () => {
    let resolveFirst: (() => void) | undefined;
    respondRequestMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = () => resolve("assignment-1");
        }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useRespondRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ requestId: REQUEST_ID, answer: "accept" });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      result.current.mutate({ requestId: REQUEST_ID, answer: "decline" });
    });

    expect(respondRequestMock).toHaveBeenCalledTimes(1);

    act(() => {
      resolveFirst?.();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
