import { act, render } from "@testing-library/react-native";
import { FloatingToast } from "@/shared/ui/FloatingToast";

const TOAST_STAY_MS = 2400;

describe("FloatingToast — 머무는 시간은 콜백이 바뀌어도 밀리지 않는다", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("onDone이 중간에 바뀌어도 원래 시점에 최신 onDone이 한 번 불린다", () => {
    const first = jest.fn();
    const second = jest.fn();

    const { rerender } = render(
      <FloatingToast message="저장했어요" onDone={first} />,
    );

    act(() => {
      jest.advanceTimersByTime(TOAST_STAY_MS / 2);
    });

    rerender(<FloatingToast message="저장했어요" onDone={second} />);

    act(() => {
      jest.advanceTimersByTime(TOAST_STAY_MS / 2);
    });

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
