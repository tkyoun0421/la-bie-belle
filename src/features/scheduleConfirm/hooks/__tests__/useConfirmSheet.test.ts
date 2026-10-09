import { jest } from "@jest/globals";
import type { ReactNode } from "react";

const confirmScheduleMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();

const FAKE_CLIENT = {} as never;

jest.unstable_mockModule(
  "@/features/scheduleConfirm/api/confirmSchedule.api",
  () => ({ confirmSchedule: confirmScheduleMock }),
);

jest.unstable_mockModule("@/shared/api/supabase", () => ({
  supabase: FAKE_CLIENT,
}));

const { renderHook, waitFor, act } =
  await import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const React = await import("react");
const { useConfirmSheet } =
  await import("@/features/scheduleConfirm/hooks/useConfirmSheet");

type Input = Parameters<typeof useConfirmSheet>[0];

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

function openSlot(over: Record<string, unknown> = {}) {
  return {
    slotId: "s1",
    dayId: "d1",
    workDate: "2026-10-10",
    positions: ["스캔"],
    ...over,
  };
}

function input(over: Partial<Input> = {}): Input {
  return {
    month: "2026-10",
    openSlots: [],
    notifiedCount: 4,
    onClose: jest.fn(),
    ...over,
  };
}

function mount(over: Partial<Input> = {}) {
  const { wrapper } = createWrapper();

  return renderHook(() => useConfirmSheet(input(over)), { wrapper });
}

beforeEach(() => {
  confirmScheduleMock.mockReset();
  confirmScheduleMock.mockResolvedValue(undefined);
});

describe("useConfirmSheet — 확정 전·성공·실패가 얼굴 셋이다", () => {
  it("아직이면 묻는 얼굴이고 달 이름이 제목에 든다", () => {
    const { result } = mount();

    expect(result.current.face).toBe("ask");
    expect(result.current.askTitle).toBe("10월 근무표를 확정할까요?");
    expect(result.current.askButtonLabel).toBe("10월 근무표 확정하기");
  });

  it("빈 자리가 없으면 경고 묶음이 없다", () => {
    const { result } = mount();

    expect(result.current.vacancy).toBeNull();
  });

  it("빈 자리는 날과 포지션으로 줄을 세운다", () => {
    const { result } = mount({
      openSlots: [
        openSlot({ slotId: "s1" }),
        openSlot({ slotId: "s2", positions: ["메인", "스캔"] }),
      ],
    });

    expect(result.current.vacancy?.headLine).toBe("빈 자리 2개가 있어요");
    expect(result.current.vacancy?.itemLines).toHaveLength(2);
    expect(result.current.vacancy?.itemLines[1]).toContain("메인·스캔");
    expect(result.current.vacancy?.overflowLine).toBeNull();
  });

  it("넷을 넘으면 나머지를 한 줄로 접는다", () => {
    const slots = [1, 2, 3, 4, 5, 6].map((at) =>
      openSlot({ slotId: `s${at}` }),
    );
    const { result } = mount({ openSlots: slots });

    expect(result.current.vacancy?.itemLines).toHaveLength(4);
    expect(result.current.vacancy?.overflowLine).toBe("외 2개");
  });

  it("성공하면 확정한 얼굴과 알린 수를 낸다", async () => {
    const { result } = mount();

    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.face).toBe("done"));

    expect(result.current.doneTitle).toBe("10월 근무표를 확정했어요");
    expect(result.current.doneNote).toBe("배정된 4명에게 알림을 보냈어요");
  });

  it("실패하면 실패 얼굴이다", async () => {
    confirmScheduleMock.mockRejectedValue(new Error("못 확정했다"));

    const { result } = mount();

    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.face).toBe("failed"));
  });
});

describe("useConfirmSheet — 조각이 자기 mutation을 부른다", () => {
  it("확정하면 그 달이 실려 간다", async () => {
    const { result } = mount();

    act(() => result.current.confirm());

    await waitFor(() =>
      expect(confirmScheduleMock).toHaveBeenCalledWith(FAKE_CLIENT, "2026-10"),
    );
  });

  it("성공한 뒤 잠시 두고 스스로 닫는다", async () => {
    const onClose = jest.fn();
    const { result } = mount({ onClose });

    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.face).toBe("done"));

    expect(onClose).not.toHaveBeenCalled();

    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 3000 });
  });
});
