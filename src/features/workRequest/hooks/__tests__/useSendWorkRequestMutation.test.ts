import { jest } from "@jest/globals";
import type { ReactNode } from "react";

// 구현 대상: src/features/workRequest/hooks/useSendWorkRequestMutation.ts
//
// 관리자가 픽커의 미신청 줄에서 고른 사람들에게 근무 요청을 보낸다
// (`sendWorkRequest.ts`의 `sendWorkRequest(client, slotId, profileIds)`). 성공하면
// `['schedule']`·`['payroll']`·`['requests']`를 무효화한다(plan schedule-requests.md
// 「총괄이 정한 것」 6, design.md 「근무 요청 보내기」).

const sendWorkRequestMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule(
  "@/features/workRequest/api/sendWorkRequest.api",
  () => ({
    sendWorkRequest: sendWorkRequestMock,
  }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { DomainError } = await import("@/shared/api/errors");
const { useSendWorkRequestMutation } =
  await import("@/features/workRequest/hooks/useSendWorkRequestMutation");

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

const SLOT_ID = "slot-1";
const PROFILE_IDS = ["profile-1", "profile-2"];

beforeEach(() => {
  sendWorkRequestMock.mockReset();
});

describe("useSendWorkRequestMutation — send_work_request를 부르고 schedule·payroll·requests를 무효화한다", () => {
  it("slotId와 profileIds를 그대로 DAL에 넘긴다", async () => {
    sendWorkRequestMock.mockResolvedValue("request-1");
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSendWorkRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ slotId: SLOT_ID, profileIds: PROFILE_IDS });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sendWorkRequestMock).toHaveBeenCalledWith(
      FAKE_CLIENT,
      SLOT_ID,
      PROFILE_IDS,
    );
  });

  it("성공하면 schedule·payroll·requests를 무효화한다", async () => {
    sendWorkRequestMock.mockResolvedValue("request-1");
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useSendWorkRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ slotId: SLOT_ID, profileIds: PROFILE_IDS });
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

  it("자리가 이미 찼으면 DomainError('slot_full')를 그대로 error에 낸다", async () => {
    sendWorkRequestMock.mockRejectedValue(new DomainError("slot_full"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSendWorkRequestMutation(FAKE_CLIENT),
      {
        wrapper,
      },
    );

    act(() => {
      result.current.mutate({ slotId: SLOT_ID, profileIds: PROFILE_IDS });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(DomainError);
    expect(
      (result.current.error as InstanceType<typeof DomainError>).code,
    ).toBe("slot_full");
  });
});
