import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { usePushPriming } from "@/features/push/hooks/usePushPriming";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("usePushPriming", () => {
  it("localStorage에 기록이 없으면 alreadyShown이 false다", () => {
    const { result } = renderHook(() => usePushPriming());

    expect(result.current.alreadyShown).toBe(false);
  });

  it("markShown 호출 뒤 alreadyShown이 true로 바뀐다", () => {
    const { result } = renderHook(() => usePushPriming());

    act(() => {
      result.current.markShown();
    });

    expect(result.current.alreadyShown).toBe(true);
  });

  it("markShown이 localStorage에 기록을 남겨 다음 마운트에서도 alreadyShown이 true다", () => {
    const { result, unmount } = renderHook(() => usePushPriming());

    act(() => {
      result.current.markShown();
    });
    unmount();

    const { result: nextResult } = renderHook(() => usePushPriming());

    expect(nextResult.current.alreadyShown).toBe(true);
  });
});
