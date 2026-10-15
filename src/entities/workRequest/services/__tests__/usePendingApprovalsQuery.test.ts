import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import type { getPendingApprovals } from "@/entities/workRequest/api/getPendingApprovals.api";
import type { PendingApproval } from "@/entities/workRequest/model/workRequest.type";

const getPendingApprovalsMock = jest.fn<typeof getPendingApprovals>();

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
  await import("@/entities/workRequest/services/usePendingApprovalsQuery");

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

const ROWS: PendingApproval[] = [
  {
    id: "cancel-request-1",
    assignmentId: "assignment-1",
    reason: "그날 다른 일정이 생겼어요",
    createdAt: "2026-10-05T00:00:00Z",
    dayId: "day-1",
    position: "메인",
    workDate: "2026-10-12",
    startsAt: "10:00:00",
    endsAt: "18:00:00",
    name: "이준호",
    photoUrl: null,
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
