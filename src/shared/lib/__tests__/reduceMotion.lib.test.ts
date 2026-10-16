import { jest } from "@jest/globals";
import { AccessibilityInfo } from "react-native";
import type { ReduceMotionSource } from "@/shared/lib/reduceMotion.lib";

type Listener = (enabled: boolean) => void;
type Read = { resolve: (enabled: boolean) => void; reject: () => void };

const listeners: Listener[] = [];
const reads: Read[] = [];
const remove = jest.fn<() => void>();
const subscribe = jest.fn<ReduceMotionSource["addEventListener"]>(
  (_event, listener) => {
    listeners.push(listener);

    return { remove };
  },
);

Object.assign(AccessibilityInfo, {
  isReduceMotionEnabled: () =>
    new Promise<boolean>((resolve, reject) => {
      reads.push({
        resolve,
        reject: () => reject(new Error("read failed")),
      });
    }),
  addEventListener: subscribe,
});

const { REDUCE_MOTION_SOURCE, trackReduceMotion } =
  await import("@/shared/lib/reduceMotion.lib");

function lastKnown(): boolean | undefined {
  return REDUCE_MOTION_SOURCE.lastKnownReduceMotion?.();
}

function emit(enabled: boolean) {
  listeners.forEach((listener) => listener(enabled));
}

function settlePending(enabled: boolean) {
  reads.splice(0).forEach((read) => read.resolve(enabled));
}

function failPending() {
  reads.splice(0).forEach((read) => read.reject());
}

describe("trackReduceMotion — 첫 읽기 값을 마지막으로 안 값으로 든다", () => {
  it("부르기 전에는 마지막으로 안 값이 없다", () => {
    expect(lastKnown()).toBeUndefined();
  });

  it("읽기가 풀릴 때까지 기다렸다가 아무 값 없이 풀린다", async () => {
    let settled = false;
    const tracking = trackReduceMotion().then((value: unknown) => {
      settled = true;

      return value;
    });

    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(settled).toBe(false);

    settlePending(true);

    await expect(tracking).resolves.toBeUndefined();
    expect(lastKnown()).toBe(true);
  });

  it("reduceMotionChanged 구독을 하나 건다", () => {
    expect(subscribe.mock.calls.map(([event]) => event)).toEqual([
      "reduceMotionChanged",
    ]);
  });
});

describe("trackReduceMotion — 변경 이벤트를 들으면 따라간다", () => {
  it("이벤트 값이 마지막으로 안 값이 된다", () => {
    emit(false);
    expect(lastKnown()).toBe(false);

    emit(true);
    expect(lastKnown()).toBe(true);
  });

  it("이벤트를 들은 뒤 풀린 읽기는 이벤트 값을 덮지 않는다", async () => {
    emit(false);
    const tracking = trackReduceMotion();

    emit(true);
    settlePending(false);
    await tracking;

    expect(lastKnown()).toBe(true);
  });
});

describe("REDUCE_MOTION_SOURCE — 훅이 시작한 읽기는 마지막으로 안 값을 건드리지 않는다", () => {
  it("OS가 답한 값을 그대로 넘긴다", async () => {
    const read = REDUCE_MOTION_SOURCE.isReduceMotionEnabled();

    settlePending(false);

    await expect(read).resolves.toBe(false);
  });

  it("읽기가 풀려도 마지막으로 안 값은 그대로다", async () => {
    emit(true);

    const read = REDUCE_MOTION_SOURCE.isReduceMotionEnabled();
    settlePending(false);
    await read;

    expect(lastKnown()).toBe(true);
  });

  it("이벤트 앞에 시작한 읽기가 이벤트 뒤에 풀려도 이벤트 값을 덮지 않는다", async () => {
    emit(true);

    const read = REDUCE_MOTION_SOURCE.isReduceMotionEnabled();
    emit(false);
    settlePending(true);
    await read;

    expect(lastKnown()).toBe(false);
  });
});

describe("trackReduceMotion — 여러 번 불러도 구독은 하나고 떼지 않는다", () => {
  it("다시 불러도 구독은 하나다", async () => {
    const tracking = trackReduceMotion();
    settlePending(false);
    await tracking;

    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it("구독을 떼는 일이 없다", () => {
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("trackReduceMotion — 읽기가 실패해도 앱 시작을 막지 않는다", () => {
  it("거절하지 않고 풀린다", async () => {
    const tracking = trackReduceMotion();

    failPending();

    await expect(tracking).resolves.toBeUndefined();
  });

  it("실패한 뒤에도 구독은 서 있어 이벤트를 따른다", async () => {
    const tracking = trackReduceMotion();
    failPending();
    await tracking;

    emit(true);
    expect(lastKnown()).toBe(true);

    emit(false);
    expect(lastKnown()).toBe(false);
    expect(subscribe).toHaveBeenCalledTimes(1);
  });
});
