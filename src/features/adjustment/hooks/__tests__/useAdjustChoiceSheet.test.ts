const { renderHook } = await import("@testing-library/react-native");
const { useAdjustChoiceSheet } =
  await import("@/features/adjustment/hooks/useAdjustChoiceSheet");

describe("useAdjustChoiceSheet — 배정 시간을 안내 줄로 세운다", () => {
  it("배정된 분을 시간으로 읽어 안내한다", () => {
    const { result } = renderHook(() =>
      useAdjustChoiceSheet({ assignedMinutes: 480 }),
    );

    expect(result.current.extraHint).toBe("배정 8시간에 더해져요");
  });

  it("시간이 안 떨어지면 분까지 읽는다", () => {
    const { result } = renderHook(() =>
      useAdjustChoiceSheet({ assignedMinutes: 90 }),
    );

    expect(result.current.extraHint).toContain("1시간 30분");
  });
});
