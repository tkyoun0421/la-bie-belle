import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAmountReveal } from "@/shared/hooks/useAmountReveal";

describe("useAmountReveal", () => {
  it("기본이 가려짐이면 masked=true로 시작하고 훑기는 돌지 않는다", () => {
    const { result } = renderHook(() => useAmountReveal(true));

    expect(result.current.masked).toBe(true);
    expect(result.current.revealing).toBe(false);
  });

  it("기본이 안 가려짐이면 masked=false로 시작하지만, 손으로 연 게 아니라 훑기는 돌지 않는다", () => {
    const { result } = renderHook(() => useAmountReveal(false));

    expect(result.current.masked).toBe(false);
    expect(result.current.revealing).toBe(false);
  });

  it("toggle()로 가려진 금액을 열면 masked가 풀리고 훑기가 돈다", () => {
    const { result } = renderHook(() => useAmountReveal(true));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.masked).toBe(false);
    expect(result.current.revealing).toBe(true);
  });

  it("maskedByDefault가 false여도 toggle() 한 번에 가려진다", () => {
    const { result } = renderHook(() => useAmountReveal(false));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.masked).toBe(true);
  });

  it("가리는 방향으로 뒤집힐 때는 revealing이 켜지지 않는다", () => {
    const { result } = renderHook(() => useAmountReveal(false));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.masked).toBe(true);
    expect(result.current.revealing).toBe(false);
  });

  it("settle()은 revealing만 끄고 masked는 그대로 둔다", () => {
    const { result } = renderHook(() => useAmountReveal(true));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.revealing).toBe(true);

    act(() => {
      result.current.settle();
    });

    expect(result.current.revealing).toBe(false);
    expect(result.current.masked).toBe(false);
  });

  it("가림이 다시 걸리면 settle() 없이도 revealing이 즉시 꺼진다", () => {
    const { result } = renderHook(() => useAmountReveal(true));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.revealing).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.masked).toBe(true);
    expect(result.current.revealing).toBe(false);
  });

  it("닫았다 다시 열면 revealing이 다시 true가 된다", () => {
    const { result } = renderHook(() => useAmountReveal(true));

    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.settle();
    });
    act(() => {
      result.current.toggle();
    });
    expect(result.current.masked).toBe(true);
    expect(result.current.revealing).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.masked).toBe(false);
    expect(result.current.revealing).toBe(true);
  });

  it("기본으로 열린 경우와 손으로 연 경우는 masked 값이 같아도 revealing으로 구분된다", () => {
    const byDefault = renderHook(() => useAmountReveal(false));
    const byHand = renderHook(() => useAmountReveal(true));

    act(() => {
      byHand.result.current.toggle();
    });

    expect(byDefault.result.current.masked).toBe(false);
    expect(byHand.result.current.masked).toBe(false);
    expect(byDefault.result.current.revealing).toBe(false);
    expect(byHand.result.current.revealing).toBe(true);
  });

  it("화면을 벗어났다 돌아오면(재마운트) 손으로 연 상태가 초기화되어 다시 가려진다", () => {
    const first = renderHook(() => useAmountReveal(true));

    act(() => {
      first.result.current.toggle();
    });
    expect(first.result.current.masked).toBe(false);

    first.unmount();

    const second = renderHook(() => useAmountReveal(true));

    expect(second.result.current.masked).toBe(true);
    expect(second.result.current.revealing).toBe(false);
  });
});
