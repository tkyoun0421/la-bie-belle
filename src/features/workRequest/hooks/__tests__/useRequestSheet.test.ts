import { jest } from "@jest/globals";
import type { ReactNode } from "react";
import type { SlotRequest } from "@/entities/workRequest/model/workRequest.type";

const respondRequestMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

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
const { WORK_REQUEST_COPY } =
  await import("@/features/workRequest/consts/workRequest.const");
const { useRequestSheet } =
  await import("@/features/workRequest/hooks/useRequestSheet");

const REQUEST = {
  id: "r1",
  slotId: "s2",
  closedAt: null,
  expiresAt: "2099-01-01T00:00:00.000Z",
  candidates: [
    {
      profileId: "p1",
      status: "pending",
      expiresAt: "2099-01-01T00:00:00.000Z",
    },
  ],
  positions: ["서빙"],
  workDate: "2026-10-20",
  startsAt: "10:00:00",
  endsAt: "18:00:00",
} satisfies SlotRequest;

const answered = jest.fn();
const seatTaken = jest.fn();

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

function mounted(request: SlotRequest = REQUEST) {
  const { wrapper } = createWrapper();

  return renderHook(
    () =>
      useRequestSheet({
        request,
        onAnswered: answered,
        onSeatTaken: seatTaken,
      }),
    { wrapper },
  );
}

beforeEach(() => {
  respondRequestMock.mockReset();
  answered.mockClear();
  seatTaken.mockClear();
  respondRequestMock.mockResolvedValue(undefined);
});

describe("useRequestSheet — 요청 하나가 그릴 값을 완성해 준다", () => {
  it("부제가 날·포지션·시각 셋을 잇는다", () => {
    const { result } = mounted();

    expect(result.current.subtitle).toBe(
      "10월 20일(화) · 서빙 · 10:00 – 18:00",
    );
  });

  it("살아 있는 요청은 끝나지 않았다", () => {
    expect(mounted().result.current.ended).toBe(false);
  });

  it("만료된 요청은 끝난 것으로 선다", () => {
    const { result } = mounted({
      ...REQUEST,
      expiresAt: "2020-01-01T00:00:00.000Z",
    });

    expect(result.current.ended).toBe(true);
  });

  it("아직 아무것도 안 보냈으면 보내는 중도 실패도 아니다", () => {
    const { result } = mounted();

    expect(result.current.sending).toBe(false);
    expect(result.current.failedLine).toBeNull();
  });
});

describe("useRequestSheet — 수락과 거절이 자기 mutation으로 나간다", () => {
  it("수락이 그 요청 id로 가고 성공하면 끝났다고 알린다", async () => {
    const { result } = mounted();

    act(() => result.current.accept());

    await waitFor(() =>
      expect(respondRequestMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "r1",
        "accept",
      ),
    );

    await waitFor(() => expect(answered).toHaveBeenCalled());
  });

  it("거절도 같은 문으로 나간다", async () => {
    const { result } = mounted();

    act(() => result.current.decline());

    await waitFor(() =>
      expect(respondRequestMock).toHaveBeenCalledWith(
        FAKE_CLIENT,
        "r1",
        "decline",
      ),
    );
  });

  it("자리가 찼으면 그 사건을 문구로 만들어 올려 보낸다", async () => {
    respondRequestMock.mockRejectedValue(new DomainError("slot_full"));

    const { result } = mounted();

    act(() => result.current.accept());

    await waitFor(() =>
      expect(seatTaken).toHaveBeenCalledWith(
        "10월 20일 서빙 자리는 다른 분이 맡았어요",
      ),
    );

    expect(answered).not.toHaveBeenCalled();
  });

  it("통신이 끊긴 것은 실패로 세우고 올려 보내지 않는다", async () => {
    respondRequestMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.accept());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(seatTaken).not.toHaveBeenCalled();
    expect(answered).not.toHaveBeenCalled();
  });
});

describe("useRequestSheet — 실패 문안을 controller가 완성해 내려준다", () => {
  it("통신이 끊기면 failedLine이 그 슬라이스의 문안과 같다", async () => {
    respondRequestMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.accept());

    await waitFor(() => {
      expect(result.current.failedLine).toBe(WORK_REQUEST_COPY.sendFailed);
    });
  });

  it("failedLine이 빈 글자가 아니다", async () => {
    respondRequestMock.mockRejectedValue(new Error("끊겼다"));

    const { result } = mounted();

    act(() => result.current.accept());

    await waitFor(() => expect(result.current.failedLine).not.toBeNull());

    expect(result.current.failedLine).toBeTruthy();
  });
});
