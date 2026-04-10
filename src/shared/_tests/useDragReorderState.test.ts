import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDragReorderState } from "#/shared/hooks/useDragReorderState";

describe("useDragReorderState", () => {
  it("tracks drag start, drop target, and clear", () => {
    const { result } = renderHook(() => useDragReorderState());

    act(() => {
      result.current.startDrag("position-1");
    });

    expect(result.current.draggingItemId).toBe("position-1");
    expect(result.current.dropTargetItemId).toBeNull();

    act(() => {
      result.current.setDropTarget("position-2");
    });

    expect(result.current.dropTargetItemId).toBe("position-2");

    act(() => {
      result.current.clearDragState();
    });

    expect(result.current.draggingItemId).toBeNull();
    expect(result.current.dropTargetItemId).toBeNull();
  });

  it("ignores drag updates when disabled", () => {
    const { result } = renderHook(() =>
      useDragReorderState({ disabled: true })
    );

    act(() => {
      result.current.startDrag("position-1");
      result.current.setDropTarget("position-2");
    });

    expect(result.current.draggingItemId).toBeNull();
    expect(result.current.dropTargetItemId).toBeNull();
  });

  it("does not mark the same item as its own drop target", () => {
    const { result } = renderHook(() => useDragReorderState());

    act(() => {
      result.current.startDrag("position-1");
      result.current.setDropTarget("position-1");
    });

    expect(result.current.dropTargetItemId).toBeNull();
  });
});
