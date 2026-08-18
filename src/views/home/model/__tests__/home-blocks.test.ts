import { describe, expect, it } from "vitest";

import { toHomeBlocks } from "@/views/home/model/home-blocks";
import type { HomeViewModel } from "@/views/home/model/home-view-model";

const NOW = new Date("2026-08-18T08:00:00Z");

const FILLED_MODEL: HomeViewModel = {
  notices: { state: "ready", data: [{ id: "n1", kind: "schedule-confirmed", month: "2026-08" }] },
  today: {
    state: "ready",
    data: {
      date: "2026-08-18",
      position: "홀서빙",
      startTime: "14:00",
      endTime: "22:00",
      headcount: 4,
      ceremonyTime: "14:00",
      attendanceWindow: { action: "check-in", scheduledAt: "2026-08-18T09:00:00Z" },
    },
  },
  week: {
    state: "ready",
    data: {
      days: [
        { date: "2026-08-17", hasShift: false },
        { date: "2026-08-18", hasShift: true },
        { date: "2026-08-19", hasShift: true },
        { date: "2026-08-20", hasShift: false },
        { date: "2026-08-21", hasShift: false },
        { date: "2026-08-22", hasShift: false },
        { date: "2026-08-23", hasShift: false },
      ],
    },
  },
  upcoming: {
    state: "ready",
    data: [{ date: "2026-08-19", position: "홀서빙", startTime: "14:00", endTime: "22:00" }],
  },
  pay: {
    state: "ready",
    data: {
      rows: [
        { kind: "last-week", count: 2, hours: 11, amount: 240000 },
        { kind: "this-month", month: 8, count: 6, hours: 30, amount: 960000 },
        { kind: "year-to-date", year: 2026, count: 58, amount: 5400000 },
      ],
    },
  },
};

function withBlock<K extends keyof HomeViewModel>(
  model: HomeViewModel,
  key: K,
  value: HomeViewModel[K],
): HomeViewModel {
  return { ...model, [key]: value };
}

function statusOf(plan: ReturnType<typeof toHomeBlocks>, block: string) {
  return plan.find((entry) => entry.block === block)?.status;
}

describe("toHomeBlocks — 인수 조건 6·7, 알림과 오늘만 접힌다·급여는 셋 다 비면 한 줄·전부 실패는 한 장", () => {
  it("데이터가 다 있는 날은 다섯 블록이 순서대로 filled다", () => {
    const plan = toHomeBlocks(FILLED_MODEL, NOW);

    expect(plan).toEqual([
      { block: "notices", status: "filled" },
      { block: "today", status: "filled" },
      { block: "week", status: "filled" },
      { block: "upcoming", status: "filled" },
      { block: "pay", status: "filled" },
    ]);
  });

  it("알림이 없으면 통째로 접혀 배열에서 빠진다", () => {
    const model = withBlock(FILLED_MODEL, "notices", { state: "ready", data: [] });

    const plan = toHomeBlocks(model, NOW);

    expect(statusOf(plan, "notices")).toBeUndefined();
    expect(plan.some((entry) => entry.block === "notices")).toBe(false);
  });

  it("근무 없는 날은 오늘 블록이 통째로 접혀 배열에서 빠진다", () => {
    const model = withBlock(FILLED_MODEL, "today", { state: "ready", data: null });

    const plan = toHomeBlocks(model, NOW);

    expect(plan.some((entry) => entry.block === "today")).toBe(false);
  });

  it("오늘 블록이 없는 날은 이번 주가 자연히 두 번째 자리로 올라온다", () => {
    let model = withBlock(FILLED_MODEL, "notices", { state: "ready", data: [] });
    model = withBlock(model, "today", { state: "ready", data: null });

    const plan = toHomeBlocks(model, NOW);

    expect(plan[0]?.block).toBe("week");
  });

  it("이번 주에 근무가 하나도 없어도 블록은 안 사라지고 empty로 남는다", () => {
    const model = withBlock(FILLED_MODEL, "week", {
      state: "ready",
      data: { days: [] },
    });

    const plan = toHomeBlocks(model, NOW);

    expect(statusOf(plan, "week")).toBe("empty");
  });

  it("다가오는 근무가 없어도 블록은 안 사라지고 empty로 남는다", () => {
    const model = withBlock(FILLED_MODEL, "upcoming", { state: "ready", data: [] });

    const plan = toHomeBlocks(model, NOW);

    expect(statusOf(plan, "upcoming")).toBe("empty");
  });

  it("급여 세 행이 다 없으면 한 줄로 접힌다 — empty", () => {
    const model = withBlock(FILLED_MODEL, "pay", {
      state: "ready",
      data: {
        rows: [
          { kind: "last-week", count: 0, hours: 0, amount: null },
          { kind: "this-month", month: 8, count: 0, hours: 0, amount: null },
          { kind: "year-to-date", year: 2026, count: 0, amount: null },
        ],
      },
    });

    const plan = toHomeBlocks(model, NOW);

    expect(statusOf(plan, "pay")).toBe("empty");
  });

  it("급여가 한 행이라도 있으면 empty가 아니라 filled다", () => {
    const model = withBlock(FILLED_MODEL, "pay", {
      state: "ready",
      data: {
        rows: [
          { kind: "last-week", count: 0, hours: 0, amount: null },
          { kind: "this-month", month: 8, count: 6, hours: 30, amount: 500000 },
          { kind: "year-to-date", year: 2026, count: 0, amount: null },
        ],
      },
    });

    const plan = toHomeBlocks(model, NOW);

    expect(statusOf(plan, "pay")).toBe("filled");
  });

  it("다섯 빈 상태가 동시에 온 날은 블록 셋만 남는다", () => {
    let model = withBlock(FILLED_MODEL, "notices", { state: "ready", data: [] });
    model = withBlock(model, "today", { state: "ready", data: null });
    model = withBlock(model, "week", {
      state: "ready",
      data: {
        days: [
          { date: "2026-08-17", hasShift: false },
          { date: "2026-08-18", hasShift: false },
          { date: "2026-08-19", hasShift: false },
          { date: "2026-08-20", hasShift: false },
          { date: "2026-08-21", hasShift: false },
          { date: "2026-08-22", hasShift: false },
          { date: "2026-08-23", hasShift: false },
        ],
      },
    });
    model = withBlock(model, "upcoming", { state: "ready", data: [] });
    model = withBlock(model, "pay", {
      state: "ready",
      data: {
        rows: [
          { kind: "last-week", count: 0, hours: 0, amount: null },
          { kind: "this-month", month: 8, count: 0, hours: 0, amount: null },
          { kind: "year-to-date", year: 2026, count: 0, amount: null },
        ],
      },
    });

    const plan = toHomeBlocks(model, NOW);

    expect(plan).toEqual([
      { block: "week", status: "empty" },
      { block: "upcoming", status: "empty" },
      { block: "pay", status: "empty" },
    ]);
  });

  it("한 블록만 실패해도 그 블록만 failed고 나머지 넷은 산다", () => {
    const model = withBlock(FILLED_MODEL, "pay", { state: "failed" });

    const plan = toHomeBlocks(model, NOW);

    expect(statusOf(plan, "pay")).toBe("failed");
    expect(statusOf(plan, "notices")).toBe("filled");
    expect(statusOf(plan, "today")).toBe("filled");
    expect(statusOf(plan, "week")).toBe("filled");
    expect(statusOf(plan, "upcoming")).toBe("filled");
  });

  it("다섯 블록이 전부 실패하면 다섯 다 failed로 남는다 — 화면 한 장으로 바꾸는 판단의 근거", () => {
    const model: HomeViewModel = {
      notices: { state: "failed" },
      today: { state: "failed" },
      week: { state: "failed" },
      upcoming: { state: "failed" },
      pay: { state: "failed" },
    };

    const plan = toHomeBlocks(model, NOW);

    expect(plan).toHaveLength(5);
    expect(plan.every((entry) => entry.status === "failed")).toBe(true);
  });

  it("아직 도착하지 않은 블록은 loading이고, 도착한 블록과 섞여도 서로 안 밀린다", () => {
    let model = withBlock(FILLED_MODEL, "upcoming", { state: "loading" });
    model = withBlock(model, "pay", { state: "loading" });

    const plan = toHomeBlocks(model, NOW);

    expect(statusOf(plan, "notices")).toBe("filled");
    expect(statusOf(plan, "today")).toBe("filled");
    expect(statusOf(plan, "week")).toBe("filled");
    expect(statusOf(plan, "upcoming")).toBe("loading");
    expect(statusOf(plan, "pay")).toBe("loading");
  });
});
