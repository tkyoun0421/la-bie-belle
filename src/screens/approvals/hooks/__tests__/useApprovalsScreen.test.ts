import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const getPendingApprovalsMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();
const decideCancelRequestMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/entities/workRequest/api/getPendingApprovals.api",
  () => ({ getPendingApprovals: getPendingApprovalsMock }),
);

jest.unstable_mockModule(
  "@/features/workRequest/api/decideCancelRequest.api",
  () => ({ decideCancelRequest: decideCancelRequestMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { APPROVALS_COPY, CUSTOM_REJECT_REASON } =
  await import("@/screens/approvals/consts/approvals.const");
const { useApprovalsScreen } =
  await import("@/screens/approvals/hooks/useApprovalsScreen");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }

  return { wrapper };
}

function fakeRouter() {
  return {
    canGoBack: jest.fn(() => true),
    back: jest.fn(),
    replace: jest.fn(),
  };
}

function approval(id: string, workDate: string, name: string) {
  return {
    id,
    assignment_id: `assign-${id}`,
    reason: `${name}의 사정`,
    created_at: "2026-10-01T03:00:00.000Z",
    assignments: {
      day_id: `day-${id}`,
      position: "메인",
      days: {
        work_date: workDate,
        starts_at: "18:00:00",
        ends_at: "23:00:00",
      },
    },
    profiles: { display_name: name, photo_url: null },
  };
}

beforeEach(() => {
  getPendingApprovalsMock.mockReset();
  decideCancelRequestMock.mockReset();

  getPendingApprovalsMock.mockResolvedValue([]);
  decideCancelRequestMock.mockResolvedValue(undefined);
});

async function mounted(router = fakeRouter()) {
  const { wrapper } = createWrapper();
  const hook = renderHook(() => useApprovalsScreen(router), {
    wrapper,
  });

  await waitFor(() =>
    expect(hook.result.current.listState).not.toBe("loading"),
  );

  return { ...hook, router };
}

describe("useApprovalsScreen — 목록과 시트와 확인창을 한 자리가 든다", () => {
  it("읽기 전에는 loading이다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApprovalsScreen(fakeRouter()), {
      wrapper,
    });

    expect(result.current.listState).toBe("loading");
  });

  it("올 것이 없으면 empty다", async () => {
    const { result } = await mounted();

    expect(result.current.listState).toBe("empty");
    expect(result.current.rows).toEqual([]);
  });

  it("근무 날이 가까운 것부터 선다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("late", "2026-10-20", "박수진"),
      approval("soon", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    expect(result.current.listState).toBe("rows");
    expect(result.current.rows.map((row) => row.id)).toEqual(["soon", "late"]);
    expect(result.current.rows[0].title).toContain("이준호");
    expect(result.current.rows[0].detail).toBe("이준호의 사정");
  });

  it("줄을 누르면 상세가 서고 얼굴은 detail이다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    expect(result.current.detail).toBeNull();

    act(() => result.current.rows[0].press());

    expect(result.current.face).toBe("detail");
    expect(result.current.detail?.title).toContain("이준호");
    expect(result.current.detail?.reason).toBe("이준호의 사정");
  });

  it("이유를 안 고르면 거절을 못 보낸다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.showFace("reject"));

    expect(result.current.canSend).toBe(false);

    act(() => result.current.choose("no_replacement"));

    expect(result.current.canSend).toBe(true);
  });

  it("직접 쓰기는 글이 있어야 보낸다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.showFace("reject"));
    act(() => result.current.choose(CUSTOM_REJECT_REASON));

    expect(result.current.canSend).toBe(false);

    act(() => result.current.write("그날은 어려워요"));

    expect(result.current.canSend).toBe(true);
  });

  it("고른 문장이 그대로 간다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.showFace("reject"));
    act(() => result.current.choose("no_replacement"));
    act(() => result.current.reject());

    await waitFor(() =>
      expect(decideCancelRequestMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "one",
        "rejected",
        "그날 대신 나올 사람이 없어요",
      ),
    );
  });

  it("거절이 끝나면 그 줄이 빠지고 토스트가 선다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result, router } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.showFace("reject"));
    act(() => result.current.choose("no_replacement"));
    act(() => result.current.reject());

    await waitFor(() =>
      expect(result.current.toast).toBe(APPROVALS_COPY.rejected),
    );

    expect(result.current.detail).toBeNull();
    expect(result.current.listState).toBe("empty");
    expect(router.replace).not.toHaveBeenCalled();

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });

  it("승인은 한 번 더 묻고 확인하면 그 자리를 채우는 날로 간다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result, router } = await mounted();

    act(() => result.current.rows[0].press());

    expect(result.current.confirming).toBe(false);

    act(() => result.current.askApprove());

    expect(result.current.confirming).toBe(true);
    expect(result.current.confirmBody).toContain("이준호");

    act(() => result.current.approve());

    await waitFor(() =>
      expect(decideCancelRequestMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "one",
        "approved",
        undefined,
      ),
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        "/admin/schedule?date=2026-10-05&from=approvals",
      ),
    );

    expect(result.current.toast).toBeNull();
  });

  it("확인창을 닫으면 실패도 함께 걷힌다", async () => {
    decideCancelRequestMock.mockRejectedValue(new Error("끊겼다"));
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.askApprove());
    act(() => result.current.approve());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.confirming).toBe(true);
    expect(result.current.confirmLabel).toBe(APPROVALS_COPY.confirmRetry);
    expect(result.current.confirmNotice).toBe(APPROVALS_COPY.sendFailed);

    act(() => result.current.cancelApprove());

    expect(result.current.confirming).toBe(false);
    expect(result.current.failed).toBe(false);
  });

  it("거절이 실패하면 시트가 열린 채로 쓴 글이 남는다", async () => {
    decideCancelRequestMock.mockRejectedValue(new Error("끊겼다"));
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.showFace("reject"));
    act(() => result.current.choose(CUSTOM_REJECT_REASON));
    act(() => result.current.write("그날은 어려워요"));
    act(() => result.current.reject());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.face).toBe("reject");
    expect(result.current.written).toBe("그날은 어려워요");
    expect(result.current.sendLabel).toBe(APPROVALS_COPY.resend);
    expect(result.current.detail).not.toBeNull();
  });

  it("시트를 닫으면 얼굴과 고른 이유가 처음으로 돌아간다", async () => {
    getPendingApprovalsMock.mockResolvedValue([
      approval("one", "2026-10-05", "이준호"),
    ]);

    const { result } = await mounted();

    act(() => result.current.rows[0].press());
    act(() => result.current.showFace("reject"));
    act(() => result.current.choose(CUSTOM_REJECT_REASON));
    act(() => result.current.write("그날은 어려워요"));
    act(() => result.current.closeSheet());

    expect(result.current.detail).toBeNull();
    expect(result.current.face).toBe("detail");
    expect(result.current.chosen).toBeNull();
    expect(result.current.written).toBe("");
  });

  it("뒤로는 쌓인 것이 있으면 되돌아가고 없으면 관리자 홈으로 간다", async () => {
    const router = fakeRouter();
    const { result } = await mounted(router);

    act(() => result.current.goBack());

    expect(router.back).toHaveBeenCalledTimes(1);

    router.canGoBack.mockReturnValue(false);

    act(() => result.current.goBack());

    expect(router.replace).toHaveBeenCalledWith("/admin");
  });
});
