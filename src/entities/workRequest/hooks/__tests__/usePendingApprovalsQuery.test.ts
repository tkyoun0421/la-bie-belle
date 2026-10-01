import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/entities/schedule/hooks/usePendingApprovalsQuery.ts
//
// 미판정 근무 취소 요청을 읽는다(`getPendingApprovals.ts`의
// `getPendingApprovals(client)`). 캐시 키는 plan schedule-requests.md 「총괄이 정한
// 것」 5가 `['requests', 'approvals']`로 못 박았다. 관리자 홈의 「승인할 일」 줄이 이
// 훅의 길이를 읽는다(「총괄이 정한 것」 7).

const getPendingApprovalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/entities/workRequest/api/getPendingApprovals.api",
  () => ({
    getPendingApprovals: getPendingApprovalsMock,
  }),
);

const { renderHook, waitFor } = await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { usePendingApprovalsQuery } =
  await import("@/entities/workRequest/hooks/usePendingApprovalsQuery");

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

const ROWS = [
  {
    id: "cancel-request-1",
    reason: "그날 다른 일정이 생겼어요",
    assignments: {
      day_id: "day-1",
      position: "메인",
      days: { work_date: "2026-10-12" },
    },
    profiles: { display_name: "이준호", photo_url: null },
  },
];

beforeEach(() => {
  getPendingApprovalsMock.mockReset();
});

describe("usePendingApprovalsQuery — getPendingApprovals를 불러 ['requests', 'approvals']에 앉힌다", () => {
  it("client를 그대로 넘겨 DAL을 부른다", async () => {
    getPendingApprovalsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingApprovalsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getPendingApprovalsMock).toHaveBeenCalledWith(FAKE_CLIENT);
  });

  it("응답하면 대기 목록을 그대로 낸다", async () => {
    getPendingApprovalsMock.mockResolvedValue(ROWS);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingApprovalsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(ROWS);
  });

  it("DAL이 실패하면 error를 낸다", async () => {
    getPendingApprovalsMock.mockRejectedValue(new Error("통신이 끊겼다"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingApprovalsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("캐시 키는 ['requests', 'approvals']다", async () => {
    getPendingApprovalsMock.mockResolvedValue(ROWS);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => usePendingApprovalsQuery(FAKE_CLIENT), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(queryClient.getQueryData(["requests", "approvals"])).toEqual(ROWS);
  });
});
