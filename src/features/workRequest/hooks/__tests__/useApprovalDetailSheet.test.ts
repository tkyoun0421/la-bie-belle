import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const decideCancelRequestMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/features/workRequest/api/decideCancelRequest.api",
  () => ({ decideCancelRequest: decideCancelRequestMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { APPROVAL_SHEET_COPY, CUSTOM_REJECT_REASON } =
  await import("@/features/workRequest/consts/workRequest.const");
const { useApprovalDetailSheet } =
  await import("@/features/workRequest/hooks/useApprovalDetailSheet");

const APPROVAL = {
  id: "one",
  assignmentId: "assign-one",
  reason: "이준호의 사정",
  createdAt: "2026-10-01T03:00:00.000Z",
  dayId: "day-one",
  position: "메인",
  workDate: "2026-10-05",
  startsAt: "18:00:00",
  endsAt: "23:00:00",
  name: "이준호",
  photoUrl: null,
};

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

function sheetFor(hooks: { onRejected?: () => void; onApproved?: () => void }) {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useApprovalDetailSheet({
        approval: APPROVAL,
        onRejected: hooks.onRejected ?? jest.fn(),
        onApproved: hooks.onApproved ?? jest.fn(),
      }),
    { wrapper },
  );
}

beforeEach(() => {
  decideCancelRequestMock.mockReset();
  decideCancelRequestMock.mockResolvedValue(undefined);
});

describe("useApprovalDetailSheet — 조각이 취소 요청 판정을 든다", () => {
  it("열리면 얼굴은 detail이고 상세가 완성돼 있다", () => {
    const { result } = sheetFor({});

    expect(result.current.face).toBe("detail");
    expect(result.current.detail.title).toContain("이준호");
    expect(result.current.detail.reason).toBe("이준호의 사정");
  });

  it("이유를 안 고르면 거절을 못 보낸다", () => {
    const { result } = sheetFor({});

    act(() => result.current.showFace("reject"));

    expect(result.current.canSend).toBe(false);

    act(() => result.current.choose("no_replacement"));

    expect(result.current.canSend).toBe(true);
  });

  it("직접 쓰기는 글이 있어야 보낸다", () => {
    const { result } = sheetFor({});

    act(() => result.current.showFace("reject"));
    act(() => result.current.choose(CUSTOM_REJECT_REASON));

    expect(result.current.canSend).toBe(false);

    act(() => result.current.write("그날은 어려워요"));

    expect(result.current.canSend).toBe(true);
  });

  it("고른 문장이 그대로 간다", async () => {
    const { result } = sheetFor({});

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

  it("거절이 끝나면 거절했다고 알린다", async () => {
    const onRejected = jest.fn();
    const onApproved = jest.fn();
    const { result } = sheetFor({ onRejected, onApproved });

    act(() => result.current.showFace("reject"));
    act(() => result.current.choose("no_replacement"));
    act(() => result.current.reject());

    await waitFor(() => expect(onRejected).toHaveBeenCalledTimes(1));

    expect(onApproved).not.toHaveBeenCalled();
  });

  it("승인은 한 번 더 묻고 확인하면 승인했다고 알린다", async () => {
    const onRejected = jest.fn();
    const onApproved = jest.fn();
    const { result } = sheetFor({ onRejected, onApproved });

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
    await waitFor(() => expect(onApproved).toHaveBeenCalledTimes(1));

    expect(onRejected).not.toHaveBeenCalled();
  });

  it("확인창을 닫으면 실패도 함께 걷힌다", async () => {
    decideCancelRequestMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = sheetFor({});

    act(() => result.current.askApprove());
    act(() => result.current.approve());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.confirming).toBe(true);
    expect(result.current.confirmLabel).toBe(APPROVAL_SHEET_COPY.confirmRetry);
    expect(result.current.confirmNotice).toBe(APPROVAL_SHEET_COPY.sendFailed);

    act(() => result.current.cancelApprove());

    expect(result.current.confirming).toBe(false);
    expect(result.current.failed).toBe(false);
  });

  it("거절이 실패하면 쓴 글이 남고 다시 보내기를 든다", async () => {
    decideCancelRequestMock.mockRejectedValue(new Error("끊겼다"));

    const onRejected = jest.fn();
    const { result } = sheetFor({ onRejected });

    act(() => result.current.showFace("reject"));
    act(() => result.current.choose(CUSTOM_REJECT_REASON));
    act(() => result.current.write("그날은 어려워요"));
    act(() => result.current.reject());

    await waitFor(() => expect(result.current.failed).toBe(true));

    expect(result.current.face).toBe("reject");
    expect(result.current.written).toBe("그날은 어려워요");
    expect(result.current.sendLabel).toBe(APPROVAL_SHEET_COPY.resend);
    expect(onRejected).not.toHaveBeenCalled();
  });
});
