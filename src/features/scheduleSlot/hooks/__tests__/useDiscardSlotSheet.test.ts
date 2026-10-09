const { renderHook } = await import("@testing-library/react-native");
const { useDiscardSlotSheet } =
  await import("@/features/scheduleSlot/hooks/useDiscardSlotSheet");

describe("useDiscardSlotSheet — 지워질 사람을 경고 줄로 세운다", () => {
  it("배정된 사람 이름이 경고 줄에 든다", () => {
    const { result } = renderHook(() =>
      useDiscardSlotSheet({ name: "이준호" }),
    );

    expect(result.current.warningLine).toContain("이준호");
  });
});
