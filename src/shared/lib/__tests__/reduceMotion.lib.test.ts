import { jest } from "@jest/globals";
import { AccessibilityInfo } from "react-native";

type Listener = (enabled: boolean) => void;

const os = { enabled: false, failing: false };
const listeners: Listener[] = [];

Object.assign(AccessibilityInfo, {
  isReduceMotionEnabled: jest.fn(() =>
    os.failing
      ? Promise.reject(new Error("read failed"))
      : Promise.resolve(os.enabled),
  ),
  addEventListener: jest.fn((_event: string, listener: Listener) => {
    listeners.push(listener);

    return { remove: () => {} };
  }),
});

const { REDUCE_MOTION_SOURCE, primeReduceMotion } =
  await import("@/shared/lib/reduceMotion.lib");

function lastKnown(): boolean | undefined {
  return REDUCE_MOTION_SOURCE.lastKnownReduceMotion?.();
}

describe("primeReduceMotion — 앱 시작에 설정을 한 번 읽어 둔다", () => {
  it("읽기 전에는 마지막으로 안 값이 없다", () => {
    expect(lastKnown()).toBeUndefined();
  });

  it("읽기가 실패해도 거절하지 않고 모르는 채로 남는다", async () => {
    os.failing = true;

    await expect(primeReduceMotion()).resolves.toBeUndefined();

    expect(lastKnown()).toBeUndefined();
    os.failing = false;
  });

  it("읽은 뒤에는 그 값을 마지막으로 안 값으로 든다", async () => {
    os.enabled = false;

    await primeReduceMotion();

    expect(lastKnown()).toBe(false);
  });

  it("설정이 켜져 있으면 참을 든다", async () => {
    os.enabled = true;

    await primeReduceMotion();

    expect(lastKnown()).toBe(true);
  });
});

describe("REDUCE_MOTION_SOURCE — 구독으로 들은 값도 기억한다", () => {
  it("변경 이벤트를 넘겨주고 그 값을 마지막으로 안 값으로 든다", () => {
    const heard: boolean[] = [];

    REDUCE_MOTION_SOURCE.addEventListener("reduceMotionChanged", (enabled) =>
      heard.push(enabled),
    );
    listeners.forEach((listener) => listener(false));

    expect(heard).toEqual([false]);
    expect(lastKnown()).toBe(false);
  });
});
