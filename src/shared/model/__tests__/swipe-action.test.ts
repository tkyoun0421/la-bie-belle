import { describe, expect, it } from "vitest";

import {
  resolveSwipeMove,
  resolveSwipeRelease,
  SWIPE_IDLE_STATE,
  type SwipeTrackState,
} from "@/shared/model/swipe-action";

const AXIS_LOCK_DISTANCE = 8;
const COMMIT_THRESHOLD = 96;

function move(state: SwipeTrackState, deltaX: number, deltaY: number): SwipeTrackState {
  return resolveSwipeMove({
    state,
    deltaX,
    deltaY,
    axisLockDistance: AXIS_LOCK_DISTANCE,
    commitThreshold: COMMIT_THRESHOLD,
  });
}

function release(state: SwipeTrackState): SwipeTrackState {
  return resolveSwipeRelease({ state, commitThreshold: COMMIT_THRESHOLD });
}

describe("swipe-action", () => {
  it("축이 확정되기 전에는 idle을 유지한다", () => {
    const next = move(SWIPE_IDLE_STATE, 3, 1);
    expect(next).toEqual(SWIPE_IDLE_STATE);
  });

  it("가로 이동이 더 크면 horizontal로 확정하고 offset을 반영한다", () => {
    const next = move(SWIPE_IDLE_STATE, 20, 2);
    expect(next.axis).toBe("horizontal");
    expect(next.phase).toBe("dragging");
    expect(next.offset).toBe(20);
  });

  it("세로 이동이 더 크면 vertical로 확정하고 rejected로 고정한다", () => {
    const next = move(SWIPE_IDLE_STATE, 2, 20);
    expect(next.axis).toBe("vertical");
    expect(next.phase).toBe("rejected");
  });

  it("한 번 rejected가 되면 이후 가로 이동이 커져도 그대로 유지한다", () => {
    const rejected = move(SWIPE_IDLE_STATE, 2, 20);
    const next = move(rejected, 200, 20);
    expect(next).toBe(rejected);
  });

  it("offset이 임계값을 넘으면 dragging 중에도 committed로 전환한다", () => {
    const dragging = move(SWIPE_IDLE_STATE, 50, 0);
    const next = move(dragging, 100, 0);
    expect(next.phase).toBe("committed");
    expect(next.offset).toBe(100);
  });

  it("committed 상태에서는 이후 이동을 무시한다", () => {
    const committed = move(move(SWIPE_IDLE_STATE, 50, 0), 100, 0);
    const next = move(committed, 5, 0);
    expect(next).toBe(committed);
  });

  it("임계값 직전에 놓으면 idle로 복귀한다", () => {
    const dragging = move(SWIPE_IDLE_STATE, 50, 0);
    const next = release(dragging);
    expect(next).toEqual(SWIPE_IDLE_STATE);
  });

  it("임계값을 넘겨 놓으면 committed로 확정한다", () => {
    const dragging = move(SWIPE_IDLE_STATE, 96, 0);
    const next = release(dragging);
    expect(next.phase).toBe("committed");
  });

  it("rejected 상태에서 놓으면 idle로 복귀한다", () => {
    const rejected = move(SWIPE_IDLE_STATE, 2, 20);
    const next = release(rejected);
    expect(next).toEqual(SWIPE_IDLE_STATE);
  });
});
