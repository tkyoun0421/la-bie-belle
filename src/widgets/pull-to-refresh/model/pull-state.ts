export type PullPhase = "idle" | "pulling" | "ready" | "refreshing";

export type PullTrackState = {
  readonly phase: PullPhase;
  readonly distance: number;
};

export const PULL_IDLE_STATE: PullTrackState = { phase: "idle", distance: 0 };

export function resolvePullMove(
  state: PullTrackState,
  distance: number,
  threshold: number,
): PullTrackState {
  if (state.phase === "refreshing") {
    return state;
  }
  if (distance <= 0) {
    return PULL_IDLE_STATE;
  }
  return { phase: distance >= threshold ? "ready" : "pulling", distance };
}

export function resolvePullRelease(state: PullTrackState): PullTrackState {
  if (state.phase === "refreshing") {
    return state;
  }
  if (state.phase === "ready") {
    return { phase: "refreshing", distance: state.distance };
  }
  return PULL_IDLE_STATE;
}

export function resolvePullComplete(): PullTrackState {
  return PULL_IDLE_STATE;
}

export function resolvePullCancel(state: PullTrackState): PullTrackState {
  if (state.phase === "refreshing") {
    return state;
  }
  return PULL_IDLE_STATE;
}
