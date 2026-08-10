import { useEffect, useRef, useState, type PointerEvent } from "react";

import {
  PULL_IDLE_STATE,
  resolvePullComplete,
  resolvePullMove,
  resolvePullRelease,
  type PullTrackState,
} from "@/widgets/pull-to-refresh/model/pull-state";

const DEFAULT_THRESHOLD = 64;
const DEFAULT_RESISTANCE = 0.5;

export type UsePullToRefreshOptions = {
  readonly onRefresh: () => Promise<void> | void;
  readonly isOnline: boolean;
  readonly onOfflineAttempt?: () => void;
  readonly threshold?: number;
  readonly resistance?: number;
};

export type UsePullToRefreshResult = {
  readonly phase: PullTrackState["phase"];
  readonly distance: number;
  readonly handlers: {
    readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
    readonly onPointerUp: () => void;
    readonly onPointerCancel: () => void;
  };
};

export function usePullToRefresh({
  onRefresh,
  isOnline,
  onOfflineAttempt,
  threshold = DEFAULT_THRESHOLD,
  resistance = DEFAULT_RESISTANCE,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [state, setState] = useState<PullTrackState>(PULL_IDLE_STATE);
  const stateRef = useRef(state);
  const startYRef = useRef<number | null>(null);

  function updateState(updater: (previous: PullTrackState) => PullTrackState) {
    setState((previous) => {
      const next = updater(previous);
      stateRef.current = next;
      return next;
    });
  }

  useEffect(() => {
    if (state.phase !== "refreshing") {
      return;
    }

    let cancelled = false;
    void Promise.resolve(onRefresh()).finally(() => {
      if (!cancelled) {
        updateState(() => resolvePullComplete());
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (stateRef.current.phase === "refreshing") {
      return;
    }
    if (window.scrollY > 0) {
      return;
    }
    startYRef.current = event.clientY;
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const startY = startYRef.current;
    if (startY === null) {
      return;
    }
    const rawDistance = event.clientY - startY;
    const distance = rawDistance > 0 ? rawDistance * resistance : 0;
    updateState((previous) => resolvePullMove(previous, distance, threshold));
  }

  function handlePointerEnd() {
    if (startYRef.current === null) {
      return;
    }
    startYRef.current = null;

    const released = resolvePullRelease(stateRef.current);
    if (released.phase === "refreshing" && !isOnline) {
      onOfflineAttempt?.();
      updateState(() => PULL_IDLE_STATE);
      return;
    }
    updateState(() => released);
  }

  return {
    phase: state.phase,
    distance: state.distance,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
    },
  };
}
