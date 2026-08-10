import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSwipeAction } from "@/shared/hooks/useSwipeAction";

const AXIS_LOCK_DISTANCE = 8;
const COMMIT_THRESHOLD = 96;

function pointerEvent(clientX: number, clientY: number) {
  return { clientX, clientY } as unknown as React.PointerEvent<HTMLElement>;
}

describe("useSwipeAction", () => {
  it("onCommit이 없으면 핸들러를 비활성으로 둔다", () => {
    const { result } = renderHook(() =>
      useSwipeAction({ axisLockDistance: AXIS_LOCK_DISTANCE, commitThreshold: COMMIT_THRESHOLD }),
    );

    expect(result.current.handlers.onPointerDown).toBeUndefined();
    expect(result.current.offset).toBe(0);
  });

  it("임계값을 넘겨 놓으면 onCommit을 1회 호출하고 offset을 되돌린다", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useSwipeAction({
        onCommit,
        axisLockDistance: AXIS_LOCK_DISTANCE,
        commitThreshold: COMMIT_THRESHOLD,
      }),
    );

    act(() => {
      result.current.handlers.onPointerDown?.(pointerEvent(0, 0));
    });
    act(() => {
      result.current.handlers.onPointerMove?.(pointerEvent(100, 0));
    });
    expect(result.current.offset).toBe(100);

    act(() => {
      result.current.handlers.onPointerUp?.(pointerEvent(100, 0));
    });

    expect(onCommit).toHaveBeenCalledOnce();
    expect(result.current.offset).toBe(0);
  });

  it("임계값 전에 놓으면 onCommit을 호출하지 않고 복귀한다", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useSwipeAction({
        onCommit,
        axisLockDistance: AXIS_LOCK_DISTANCE,
        commitThreshold: COMMIT_THRESHOLD,
      }),
    );

    act(() => {
      result.current.handlers.onPointerDown?.(pointerEvent(0, 0));
    });
    act(() => {
      result.current.handlers.onPointerMove?.(pointerEvent(30, 0));
    });
    act(() => {
      result.current.handlers.onPointerUp?.(pointerEvent(30, 0));
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.offset).toBe(0);
  });

  it("세로 이동이 이기면 가로 추적을 포기하고 offset이 0으로 유지된다", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useSwipeAction({
        onCommit,
        axisLockDistance: AXIS_LOCK_DISTANCE,
        commitThreshold: COMMIT_THRESHOLD,
      }),
    );

    act(() => {
      result.current.handlers.onPointerDown?.(pointerEvent(0, 0));
    });
    act(() => {
      result.current.handlers.onPointerMove?.(pointerEvent(2, 40));
    });
    act(() => {
      result.current.handlers.onPointerMove?.(pointerEvent(150, 45));
    });
    act(() => {
      result.current.handlers.onPointerUp?.(pointerEvent(150, 45));
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.offset).toBe(0);
  });

  it("연속 스와이프에서도 커밋은 매번 새 제스처에만 반응한다", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useSwipeAction({
        onCommit,
        axisLockDistance: AXIS_LOCK_DISTANCE,
        commitThreshold: COMMIT_THRESHOLD,
      }),
    );

    act(() => {
      result.current.handlers.onPointerDown?.(pointerEvent(0, 0));
      result.current.handlers.onPointerMove?.(pointerEvent(100, 0));
      result.current.handlers.onPointerUp?.(pointerEvent(100, 0));
    });
    expect(onCommit).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handlers.onPointerDown?.(pointerEvent(0, 0));
      result.current.handlers.onPointerMove?.(pointerEvent(100, 0));
      result.current.handlers.onPointerUp?.(pointerEvent(100, 0));
    });
    expect(onCommit).toHaveBeenCalledTimes(2);
  });
});
