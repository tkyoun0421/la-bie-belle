import { useRef, useState, type PointerEvent } from "react";

import {
  resolveSwipeMove,
  resolveSwipeRelease,
  SWIPE_IDLE_STATE,
  type SwipeTrackState,
} from "@/shared/model/swipe-action";

const DEFAULT_AXIS_LOCK_DISTANCE = 8;
const DEFAULT_COMMIT_THRESHOLD = 96;

export type UseSwipeActionOptions = {
  readonly onCommit?: () => void;
  readonly axisLockDistance?: number;
  readonly commitThreshold?: number;
};

export type UseSwipeActionResult = {
  readonly offset: number;
  readonly handlers: {
    readonly onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
    readonly onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
    readonly onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
    readonly onPointerCancel?: (event: PointerEvent<HTMLElement>) => void;
  };
};

export function useSwipeAction({
  onCommit,
  axisLockDistance = DEFAULT_AXIS_LOCK_DISTANCE,
  commitThreshold = DEFAULT_COMMIT_THRESHOLD,
}: UseSwipeActionOptions): UseSwipeActionResult {
  const [state, setState] = useState<SwipeTrackState>(SWIPE_IDLE_STATE);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  if (onCommit === undefined) {
    return { offset: 0, handlers: {} };
  }
  const commit = onCommit;

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    startRef.current = { x: event.clientX, y: event.clientY };
    setState(SWIPE_IDLE_STATE);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const start = startRef.current;
    if (start === null) {
      return;
    }
    setState((previous) =>
      resolveSwipeMove({
        state: previous,
        deltaX: event.clientX - start.x,
        deltaY: event.clientY - start.y,
        axisLockDistance,
        commitThreshold,
      }),
    );
  }

  function handlePointerEnd() {
    if (startRef.current === null) {
      return;
    }
    startRef.current = null;
    setState((previous) => {
      const next = resolveSwipeRelease({ state: previous, commitThreshold });
      if (next.phase === "committed") {
        commit();
      }
      return SWIPE_IDLE_STATE;
    });
  }

  return {
    offset: state.offset,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
    },
  };
}
