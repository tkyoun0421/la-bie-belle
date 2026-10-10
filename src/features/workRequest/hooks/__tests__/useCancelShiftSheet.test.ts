import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const createCancelRequestMock =
  jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

jest.unstable_mockModule(
  "@/features/workRequest/api/createCancelRequest.api",
  () => ({ createCancelRequest: createCancelRequestMock }),
);

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { WORK_REQUEST_COPY } =
  await import("@/features/workRequest/consts/workRequest.const");
const { useCancelShiftSheet } =
  await import("@/features/workRequest/hooks/useCancelShiftSheet");

const sent = jest.fn();

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

function mounted() {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useCancelShiftSheet({
        assignmentId: "a1",
        workDate: "2026-10-17",
        position: "안내",
        onSent: sent,
      }),
    { wrapper },
  );
}

beforeEach(() => {
  createCancelRequestMock.mockReset();
  sent.mockClear();
  createCancelRequestMock.mockResolvedValue(undefined);
});

describe("useCancelShiftSheet — 사유가 여기 산다", () => {
  it("제목이 그 날과 포지션을 든다", () => {
    expect(mounted().result.current.title).toBe(
      "근무 취소 · 10월 17일(토) 안내",
    );
  });

  it("처음 연 시트는 적은 글이 없고 보낼 수도 없다", () => {
    const { result } = mounted();

    expect(result.current.reason).toBe("");
    expect(result.current.canSend).toBe(false);
  });

  it("공백만 적으면 보낼 수 없다", () => {
    const { result } = mounted();

    act(() => result.current.writeReason("   "));

    expect(result.current.canSend).toBe(false);
  });

  it("사유를 적으면 보낼 수 있다", () => {
    const { result } = mounted();

    act(() => result.current.writeReason(" 몸이 아파요 "));

    expect(result.current.reason).toBe(" 몸이 아파요 ");
    expect(result.current.canSend).toBe(true);
  });
});

describe("useCancelShiftSheet — 보내는 일을 자기가 든다", () => {
  it("취소 요청이 그 배정 id와 다듬은 사유로 가고 보낸 뒤 알린다", async () => {
    const { result } = mounted();

    act(() => result.current.writeReason(" 몸이 아파요 "));
    act(() => result.current.send());

    await waitFor(() =>
      expect(createCancelRequestMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "a1",
        "몸이 아파요",
      ),
    );

    await waitFor(() => expect(sent).toHaveBeenCalled());
  });

  it("사유가 비어 있으면 아무것도 안 보낸다", () => {
    const { result } = mounted();

    act(() => result.current.send());

    expect(createCancelRequestMock).not.toHaveBeenCalled();
  });

  it("못 보내면 실패가 서고 적은 글이 남는다", async () => {
    createCancelRequestMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.writeReason("몸이 아파요"));
    act(() => result.current.send());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(result.current.reason).toBe("몸이 아파요");
    expect(sent).not.toHaveBeenCalled();
  });
});

describe("useCancelShiftSheet — 실패 문안을 controller가 완성해 내려준다", () => {
  it("못 보내면 failedLine이 그 슬라이스의 문안과 같다", async () => {
    createCancelRequestMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.writeReason("몸이 아파요"));
    act(() => result.current.send());

    await waitFor(() => {
      expect(result.current.failedLine).toBe(WORK_REQUEST_COPY.sendFailed);
    });
  });

  it("failedLine이 빈 글자가 아니다", async () => {
    createCancelRequestMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.writeReason("몸이 아파요"));
    act(() => result.current.send());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(result.current.failedLine).toBeTruthy();
  });
});
