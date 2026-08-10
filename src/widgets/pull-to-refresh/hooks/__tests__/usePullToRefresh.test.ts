import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePullToRefresh } from "@/widgets/pull-to-refresh/hooks/usePullToRefresh";

const THRESHOLD = 64;

function pointerEvent(clientY: number) {
  return { clientY } as unknown as React.PointerEvent<HTMLElement>;
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value });
}

describe("usePullToRefresh", () => {
  it("임계값을 넘겨 놓으면 onRefresh를 1회 실행하고 idle로 돌아온다", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, isOnline: true, threshold: THRESHOLD }),
    );

    act(() => {
      result.current.handlers.onPointerDown(pointerEvent(0));
    });
    act(() => {
      result.current.handlers.onPointerMove(pointerEvent(200));
    });
    expect(result.current.phase).toBe("ready");

    act(() => {
      result.current.handlers.onPointerUp();
    });

    await waitFor(() => expect(result.current.phase).toBe("idle"));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("임계값 전에 놓으면 onRefresh를 실행하지 않는다", () => {
    const onRefresh = vi.fn();
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, isOnline: true, threshold: THRESHOLD }),
    );

    act(() => {
      result.current.handlers.onPointerDown(pointerEvent(0));
    });
    act(() => {
      result.current.handlers.onPointerMove(pointerEvent(20));
    });
    act(() => {
      result.current.handlers.onPointerUp();
    });

    expect(result.current.phase).toBe("idle");
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("스크롤이 이미 진행된 상태에서 시작하면 당김을 시작하지 않는다", () => {
    setScrollY(40);
    const onRefresh = vi.fn();
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, isOnline: true, threshold: THRESHOLD }),
    );

    act(() => {
      result.current.handlers.onPointerDown(pointerEvent(0));
    });
    act(() => {
      result.current.handlers.onPointerMove(pointerEvent(200));
    });

    expect(result.current.phase).toBe("idle");
    setScrollY(0);
  });

  it("오프라인이면 onRefresh를 실행하지 않고 실패를 알린다", async () => {
    const onRefresh = vi.fn();
    const onOfflineAttempt = vi.fn();
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, isOnline: false, onOfflineAttempt, threshold: THRESHOLD }),
    );

    act(() => {
      result.current.handlers.onPointerDown(pointerEvent(0));
    });
    act(() => {
      result.current.handlers.onPointerMove(pointerEvent(200));
    });
    act(() => {
      result.current.handlers.onPointerUp();
    });

    await waitFor(() => expect(result.current.phase).toBe("idle"));
    expect(onRefresh).not.toHaveBeenCalled();
    expect(onOfflineAttempt).toHaveBeenCalledOnce();
  });

  it("당김을 연달아 놓아도 실행은 1회다", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, isOnline: true, threshold: THRESHOLD }),
    );

    act(() => {
      result.current.handlers.onPointerDown(pointerEvent(0));
      result.current.handlers.onPointerMove(pointerEvent(200));
      result.current.handlers.onPointerUp();
      result.current.handlers.onPointerUp();
    });

    await waitFor(() => expect(result.current.phase).toBe("idle"));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("실행 중 재당김은 두 번째 실행을 만들지 않는다", async () => {
    let resolveRefresh: () => void = () => {};
    const onRefresh = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, isOnline: true, threshold: THRESHOLD }),
    );

    act(() => {
      result.current.handlers.onPointerDown(pointerEvent(0));
      result.current.handlers.onPointerMove(pointerEvent(200));
      result.current.handlers.onPointerUp();
    });
    expect(result.current.phase).toBe("refreshing");

    act(() => {
      result.current.handlers.onPointerDown(pointerEvent(0));
      result.current.handlers.onPointerMove(pointerEvent(200));
      result.current.handlers.onPointerUp();
    });
    expect(onRefresh).toHaveBeenCalledOnce();

    act(() => {
      resolveRefresh();
    });
    await waitFor(() => expect(result.current.phase).toBe("idle"));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
