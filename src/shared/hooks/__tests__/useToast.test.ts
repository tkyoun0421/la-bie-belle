const { renderHook, act } = await import("@testing-library/react-native");
const { useToast } = await import("@/shared/hooks/useToast");

describe("useToast — 토스트는 처음엔 비어 있다", () => {
  it("아무것도 안 띄우면 null이다", () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeNull();
  });
});

describe("useToast — showToast가 kind와 message를 함께 세운다", () => {
  it("success로 띄우면 그 kind와 message가 그대로 선다", () => {
    const { result } = renderHook(() => useToast());

    act(() => result.current.showToast("success", "저장했어요"));

    expect(result.current.toast).toEqual({
      kind: "success",
      message: "저장했어요",
    });
  });

  it("info로 띄우면 그 kind와 message가 그대로 선다", () => {
    const { result } = renderHook(() => useToast());

    act(() => result.current.showToast("info", "확인해 주세요"));

    expect(result.current.toast).toEqual({
      kind: "info",
      message: "확인해 주세요",
    });
  });
});

describe("useToast — dismissToast가 비운다", () => {
  it("띄운 뒤 dismissToast를 부르면 null로 되돌아간다", () => {
    const { result } = renderHook(() => useToast());

    act(() => result.current.showToast("info", "확인해 주세요"));
    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });
});
