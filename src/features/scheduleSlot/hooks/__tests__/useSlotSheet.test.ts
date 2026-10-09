const { renderHook } = await import("@testing-library/react-native");
const { useSlotSheet } =
  await import("@/features/scheduleSlot/hooks/useSlotSheet");

describe("useSlotSheet — 확정 전과 뒤에서 빼기 문구가 다르다", () => {
  it("확정 전이면 자리를 비운다고 말한다", () => {
    const { result } = renderHook(() =>
      useSlotSheet({ confirmed: false, merged: false }),
    );

    expect(result.current.removeLabel).toBe("자리 비우기");
  });

  it("확정 뒤면 사람을 뺀다고 말한다", () => {
    const { result } = renderHook(() =>
      useSlotSheet({ confirmed: true, merged: false }),
    );

    expect(result.current.removeLabel).toBe("사람 빼기");
  });
});

describe("useSlotSheet — 겸임 자리만 나누기가 선다", () => {
  it("합쳐진 자리면 나누기가 선다", () => {
    const { result } = renderHook(() =>
      useSlotSheet({ confirmed: false, merged: true }),
    );

    expect(result.current.showSplit).toBe(true);
  });

  it("합치지 않은 자리면 나누기가 없다", () => {
    const { result } = renderHook(() =>
      useSlotSheet({ confirmed: false, merged: false }),
    );

    expect(result.current.showSplit).toBe(false);
  });
});
