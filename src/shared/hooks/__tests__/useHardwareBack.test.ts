import { jest } from "@jest/globals";

const { renderHook } = await import("@testing-library/react-native");
const { useHardwareBack } = await import("@/shared/hooks/useHardwareBack");

function fakeBackHandler() {
  const listeners: (() => boolean)[] = [];
  const remove = jest.fn();

  return {
    listeners,
    remove,
    source: {
      addEventListener: (
        _event: "hardwareBackPress",
        listener: () => boolean,
      ) => {
        listeners.push(listener);

        return { remove };
      },
    },
  };
}

describe("useHardwareBack — 닫을 것이 있을 때만 뒤로를 가로챈다", () => {
  it("닫을 것이 없으면 손을 안 건다", () => {
    const handler = fakeBackHandler();

    renderHook(() => useHardwareBack(null, handler.source));

    expect(handler.listeners).toHaveLength(0);
  });

  it("손이 있으면 걸고 기기 뒤로가 그 손을 부른다", () => {
    const handler = fakeBackHandler();
    const close = jest.fn(() => true);

    renderHook(() => useHardwareBack(close, handler.source));

    expect(handler.listeners).toHaveLength(1);

    expect(handler.listeners[0]()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("화면이 빠지면 뗀다", () => {
    const handler = fakeBackHandler();

    const { unmount } = renderHook(() =>
      useHardwareBack(() => true, handler.source),
    );

    unmount();

    expect(handler.remove).toHaveBeenCalledTimes(1);
  });

  it("손이 바뀌면 떼고 새로 건다", () => {
    const handler = fakeBackHandler();
    const first = jest.fn(() => true);
    const second = jest.fn(() => true);

    const { rerender } = renderHook(
      ({ onBack }: { onBack: (() => boolean) | null }) =>
        useHardwareBack(onBack, handler.source),
      { initialProps: { onBack: first as (() => boolean) | null } },
    );

    rerender({ onBack: second });

    expect(handler.remove).toHaveBeenCalledTimes(1);
    expect(handler.listeners).toHaveLength(2);

    handler.listeners[1]();

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(0);
  });
});
