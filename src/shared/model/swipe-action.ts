export type SwipeAxis = "undetermined" | "horizontal" | "vertical";

export type SwipePhase = "idle" | "dragging" | "committed" | "rejected";

export type SwipeTrackState = {
  readonly phase: SwipePhase;
  readonly axis: SwipeAxis;
  readonly offset: number;
};

export const SWIPE_IDLE_STATE: SwipeTrackState = {
  phase: "idle",
  axis: "undetermined",
  offset: 0,
};

export type SwipeMoveInput = {
  readonly state: SwipeTrackState;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly axisLockDistance: number;
  readonly commitThreshold: number;
};

function lockSwipeAxis(deltaX: number, deltaY: number, axisLockDistance: number): SwipeAxis {
  const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  if (distance < axisLockDistance) {
    return "undetermined";
  }
  return Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
}

export function resolveSwipeMove({
  state,
  deltaX,
  deltaY,
  axisLockDistance,
  commitThreshold,
}: SwipeMoveInput): SwipeTrackState {
  if (state.phase === "committed" || state.phase === "rejected") {
    return state;
  }

  const axis =
    state.axis === "undetermined" ? lockSwipeAxis(deltaX, deltaY, axisLockDistance) : state.axis;

  if (axis === "vertical") {
    return { phase: "rejected", axis, offset: 0 };
  }
  if (axis === "undetermined") {
    return SWIPE_IDLE_STATE;
  }

  const offset = deltaX;
  return {
    phase: Math.abs(offset) >= commitThreshold ? "committed" : "dragging",
    axis,
    offset,
  };
}

export type SwipeReleaseInput = {
  readonly state: SwipeTrackState;
  readonly commitThreshold: number;
};

export function resolveSwipeRelease({
  state,
  commitThreshold,
}: SwipeReleaseInput): SwipeTrackState {
  if (state.phase === "committed") {
    return state;
  }
  if (state.phase === "dragging" && Math.abs(state.offset) >= commitThreshold) {
    return { ...state, phase: "committed" };
  }
  return SWIPE_IDLE_STATE;
}
