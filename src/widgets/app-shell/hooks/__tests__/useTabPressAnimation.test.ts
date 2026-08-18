import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTabPressAnimation } from "@/widgets/app-shell/hooks/useTabPressAnimation";

describe("useTabPressAnimation", () => {
  it("눌린 적 없는 탭은 토큰이 0이다", () => {
    const { result } = renderHook(() => useTabPressAnimation());
    expect(result.current.pressTokenFor("home")).toBe(0);
  });

  it("탭을 누르면 그 탭의 토큰만 올라간다", () => {
    const { result } = renderHook(() => useTabPressAnimation());

    act(() => {
      result.current.onTabPress("home");
    });

    expect(result.current.pressTokenFor("home")).toBe(1);
    expect(result.current.pressTokenFor("schedule")).toBe(0);
  });

  it("같은 탭을 두 번 누르면 토큰이 다시 올라간다 — 두 번째 눌림도 애니메이션이 돈다", () => {
    const { result } = renderHook(() => useTabPressAnimation());

    act(() => {
      result.current.onTabPress("home");
    });
    const firstToken = result.current.pressTokenFor("home");

    act(() => {
      result.current.onTabPress("home");
    });
    const secondToken = result.current.pressTokenFor("home");

    expect(secondToken).not.toBe(firstToken);
  });
});
