import { jest } from "@jest/globals";

// 구현 대상: src/shared/hooks/useHardwareBack.ts
//
// 안드로이드 기기 뒤로를 가로채는 자리다. 화면 둘(리허설·근무표)이 같은 `useEffect`를
// `.tsx`에 글자까지 같이 들고 있었다 — 시트가 열려 있으면 뒤로가 화면을 빼지 말고 시트만
// 닫아야 한다.
//
// **무엇을 닫을지는 controller가 안다.** 이 자리는 그 손을 기기에 잇기만 하고, 닫을 것이
// 없을 때는 `null`을 받아 아예 안 건다 — 손을 걸어둔 채 `false`를 돌려주면 뒤로가 두 번
// 넘어가는 자리가 생긴다.

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
