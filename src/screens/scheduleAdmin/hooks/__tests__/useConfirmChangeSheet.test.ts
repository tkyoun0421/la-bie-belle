const { renderHook } = await import("@testing-library/react-native");
const { useConfirmChangeSheet } =
  await import("@/screens/scheduleAdmin/hooks/useConfirmChangeSheet");

describe("useConfirmChangeSheet — 바꿈의 문구와 버튼을 controller가 고른다", () => {
  it("넣는 경우는 넣기 버튼이 선다", () => {
    const { result } = renderHook(() =>
      useConfirmChangeSheet({
        copy: {
          kind: "add",
          incomingName: "이준호",
          incomingCanNotify: true,
        },
      }),
    );

    expect(result.current.title).toContain("이준호");
    expect(result.current.notice).toContain("알림이 가요");
    expect(result.current.cancelLabel).toBe("닫기");
    expect(result.current.confirmLabel).toBe("넣기");
  });

  it("빼는 경우는 빼기 버튼이 선다", () => {
    const { result } = renderHook(() =>
      useConfirmChangeSheet({
        copy: {
          kind: "remove",
          outgoingName: "박수진",
          outgoingCanNotify: false,
        },
      }),
    );

    expect(result.current.confirmLabel).toBe("빼기");
    expect(result.current.notice).toContain("알림을 못 받아요");
  });
});
