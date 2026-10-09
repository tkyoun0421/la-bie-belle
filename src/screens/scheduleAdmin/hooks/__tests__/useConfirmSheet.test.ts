import { jest } from "@jest/globals";

const { renderHook, act } = await import("@testing-library/react-native");
const { useConfirmSheet } =
  await import("@/screens/scheduleAdmin/hooks/useConfirmSheet");

type Input = Parameters<typeof useConfirmSheet>[0];

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
    done: false,
    failed: false,
    onClose: jest.fn(),
    ...over,
  };
}

describe("useConfirmSheet — 확정 전·성공·실패가 얼굴 셋이다", () => {
  it("아직이면 묻는 얼굴이고 달 이름이 제목에 든다", () => {
    const { result } = renderHook(() => useConfirmSheet(input()));

    expect(result.current.face).toBe("ask");
    expect(result.current.askTitle).toBe("10월 근무표를 확정할까요?");
    expect(result.current.askButtonLabel).toBe("10월 근무표 확정하기");
  });

  it("빈 자리가 없으면 경고 묶음이 없다", () => {
    const { result } = renderHook(() => useConfirmSheet(input()));

    expect(result.current.vacancy).toBeNull();
  });

  it("빈 자리는 날과 포지션으로 줄을 세운다", () => {
    const { result } = renderHook(() =>
      useConfirmSheet(
        input({
          openSlots: [
            openSlot({ slotId: "s1" }),
            openSlot({ slotId: "s2", positions: ["메인", "스캔"] }),
          ],
        }),
      ),
    );

    expect(result.current.vacancy?.headLine).toBe("빈 자리 2개가 있어요");
    expect(result.current.vacancy?.itemLines).toHaveLength(2);
    expect(result.current.vacancy?.itemLines[1]).toContain("메인·스캔");
    expect(result.current.vacancy?.overflowLine).toBeNull();
  });

  it("넷을 넘으면 나머지를 한 줄로 접는다", () => {
    const slots = [1, 2, 3, 4, 5, 6].map((at) =>
      openSlot({ slotId: `s${at}` }),
    );
    const { result } = renderHook(() =>
      useConfirmSheet(input({ openSlots: slots })),
    );

    expect(result.current.vacancy?.itemLines).toHaveLength(4);
    expect(result.current.vacancy?.overflowLine).toBe("외 2개");
  });

  it("성공하면 확정한 얼굴과 알린 수를 낸다", () => {
    const { result } = renderHook(() => useConfirmSheet(input({ done: true })));

    expect(result.current.face).toBe("done");
    expect(result.current.doneTitle).toBe("10월 근무표를 확정했어요");
    expect(result.current.doneNote).toBe("배정된 4명에게 알림을 보냈어요");
  });

  it("성공한 뒤 잠시 두고 스스로 닫는다", () => {
    jest.useFakeTimers();

    const onClose = jest.fn();

    renderHook(() => useConfirmSheet(input({ done: true, onClose })));

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("실패하면 실패 얼굴이다", () => {
    const { result } = renderHook(() =>
      useConfirmSheet(input({ failed: true })),
    );

    expect(result.current.face).toBe("failed");
  });
});
