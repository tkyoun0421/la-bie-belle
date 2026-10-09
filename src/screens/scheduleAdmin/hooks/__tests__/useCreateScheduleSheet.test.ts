const { renderHook } = await import("@testing-library/react-native");
const { useCreateScheduleSheet } =
  await import("@/screens/scheduleAdmin/hooks/useCreateScheduleSheet");

describe("useCreateScheduleSheet — 달 이름이 제목과 안내에 든다", () => {
  it("제목과 안내가 그 달을 부른다", () => {
    const { result } = renderHook(() =>
      useCreateScheduleSheet({ month: "2026-10", failed: false }),
    );

    expect(result.current.title).toBe("10월 근무표 만들기");
    expect(result.current.noticeLine).toContain("10월");
  });

  it("보내기 전에는 실패 줄이 없다", () => {
    const { result } = renderHook(() =>
      useCreateScheduleSheet({ month: "2026-10", failed: false }),
    );

    expect(result.current.failedLine).toBeNull();
  });

  it("실패하면 그 줄이 선다", () => {
    const { result } = renderHook(() =>
      useCreateScheduleSheet({ month: "2026-10", failed: true }),
    );

    expect(result.current.failedLine).not.toBeNull();
  });
});
