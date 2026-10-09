const { renderHook } = await import("@testing-library/react-native");
const { useCloseDayWarningSheet } =
  await import("@/screens/scheduleAdmin/hooks/useCloseDayWarningSheet");

describe("useCloseDayWarningSheet — 날짜와 배정 수를 문구로 세운다", () => {
  it("닫을 날을 제목으로 묻는다", () => {
    const { result } = renderHook(() =>
      useCloseDayWarningSheet({
        workDate: "2026-10-10",
        assignmentCount: 3,
      }),
    );

    expect(result.current.title).toBe("10월 10일을 닫을까요?");
  });

  it("같이 사라질 배정 수를 경고 줄로 낸다", () => {
    const { result } = renderHook(() =>
      useCloseDayWarningSheet({
        workDate: "2026-10-10",
        assignmentCount: 3,
      }),
    );

    expect(result.current.warningLine).toContain("3");
  });
});
