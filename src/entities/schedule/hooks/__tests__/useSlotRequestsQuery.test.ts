import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/entities/schedule/hooks/useSlotRequestsQuery.ts
//
// 그 달 살아 있는 근무 요청을 읽는다(`getSlotRequests.ts`의
// `getSlotRequests(client, month)`). 캐시 키는 plan schedule-requests.md 「총괄이 정한
// 것」 5가 `['requests', month]`로 못 박았다 — `['requests']` 무효화가 이 값도 낡게
// 해야 해서 REQUESTS_KEY 아래 둔다.

const getSlotRequestsMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("@/entities/schedule/api/getSlotRequests.api", () => ({
  getSlotRequests: getSlotRequestsMock,
}));

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useSlotRequestsQuery } =
  await import("@/entities/schedule/hooks/useSlotRequestsQuery");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

const MONTH = "2026-10";

const ROWS = [
  {
    id: "request-1",
    slot_id: "slot-1",
    closed_at: null,
    request_candidates: [
      {
        profile_id: "profile-1",
        status: "pending",
        expires_at: "2026-10-12T00:00:00Z",
      },
    ],
  },
];

beforeEach(() => {
  getSlotRequestsMock.mockReset();
});

describe("useSlotRequestsQuery — getSlotRequests를 그 달로 불러 ['requests', month]에 앉힌다", () => {
  it("client와 month를 그대로 넘겨 DAL을 부른다", async () => {
    getSlotRequestsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSlotRequestsQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getSlotRequestsMock).toHaveBeenCalledWith(FAKE_CLIENT, MONTH);
  });

  it("응답하면 요청 행을 그대로 낸다", async () => {
    getSlotRequestsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSlotRequestsQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(ROWS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getSlotRequestsMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSlotRequestsQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['requests', month]다", async () => {
    getSlotRequestsMock.mockResolvedValue(ROWS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useSlotRequestsQuery(FAKE_CLIENT, MONTH),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["requests", MONTH])).toEqual(ROWS);
  });
});
