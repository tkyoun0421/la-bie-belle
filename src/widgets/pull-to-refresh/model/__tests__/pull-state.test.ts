import { describe, expect, it } from "vitest";

import {
  PULL_IDLE_STATE,
  resolvePullComplete,
  resolvePullMove,
  resolvePullRelease,
} from "@/widgets/pull-to-refresh/model/pull-state";

const THRESHOLD = 64;

describe("pull-state", () => {
  it("당김 거리가 0 이하면 idle을 유지한다", () => {
    expect(resolvePullMove(PULL_IDLE_STATE, 0, THRESHOLD)).toEqual(PULL_IDLE_STATE);
    expect(resolvePullMove(PULL_IDLE_STATE, -10, THRESHOLD)).toEqual(PULL_IDLE_STATE);
  });

  it("임계값 미만이면 pulling이다", () => {
    const next = resolvePullMove(PULL_IDLE_STATE, 30, THRESHOLD);
    expect(next).toEqual({ phase: "pulling", distance: 30 });
  });

  it("임계값 이상이면 ready다", () => {
    const next = resolvePullMove(PULL_IDLE_STATE, 64, THRESHOLD);
    expect(next).toEqual({ phase: "ready", distance: 64 });
  });

  it("refreshing 중에는 이동을 무시한다", () => {
    const refreshing = { phase: "refreshing" as const, distance: 64 };
    expect(resolvePullMove(refreshing, 200, THRESHOLD)).toBe(refreshing);
  });

  it("pulling 상태에서 놓으면 idle로 되돌아간다", () => {
    const pulling = resolvePullMove(PULL_IDLE_STATE, 30, THRESHOLD);
    expect(resolvePullRelease(pulling)).toEqual(PULL_IDLE_STATE);
  });

  it("ready 상태에서 놓으면 refreshing으로 전환한다", () => {
    const ready = resolvePullMove(PULL_IDLE_STATE, 80, THRESHOLD);
    expect(resolvePullRelease(ready)).toEqual({ phase: "refreshing", distance: 80 });
  });

  it("refreshing 상태에서 release가 다시 불려도 그대로다", () => {
    const refreshing = { phase: "refreshing" as const, distance: 80 };
    expect(resolvePullRelease(refreshing)).toBe(refreshing);
  });

  it("완료되면 idle로 돌아간다", () => {
    expect(resolvePullComplete()).toEqual(PULL_IDLE_STATE);
  });
});
