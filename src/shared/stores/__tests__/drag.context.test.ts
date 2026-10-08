import { renderHook } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import {
  DragContext,
  useDrag,
  useDragging,
  useDropState,
  type DragContextValue,
} from "@/shared/stores/drag.context";

function valueOf(over: Partial<DragContextValue> = {}): DragContextValue {
  return {
    draggingId: null,
    overId: null,
    blocked: false,
    registerTarget: () => undefined,
    begin: () => undefined,
    move: () => undefined,
    finish: () => undefined,
    ...over,
  };
}

function wrapperOf(value: DragContextValue) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(DragContext.Provider, { value }, children);
  };
}

describe("drag.context — Provider 밖에서는 멈춘다", () => {
  it("useDrag가 터진다", () => {
    expect(() => renderHook(() => useDrag())).toThrow(
      "DragProvider 안에서만 쓴다",
    );
  });

  it("useDragging도 터진다", () => {
    expect(() => renderHook(() => useDragging())).toThrow(
      "DragProvider 안에서만 쓴다",
    );
  });

  it("useDropState도 터진다", () => {
    expect(() => renderHook(() => useDropState("자리"))).toThrow(
      "DragProvider 안에서만 쓴다",
    );
  });
});

describe("drag.context — 값이 그대로 내려온다", () => {
  it("useDrag가 Provider가 넣은 것을 준다", () => {
    const value = valueOf({ draggingId: "집힌것", overId: "받는것" });
    const { result } = renderHook(() => useDrag(), {
      wrapper: wrapperOf(value),
    });

    expect(result.current).toBe(value);
  });

  it("집은 것이 없으면 useDragging이 거짓이다", () => {
    const { result } = renderHook(() => useDragging(), {
      wrapper: wrapperOf(valueOf()),
    });

    expect(result.current).toBe(false);
  });

  it("집은 것이 있으면 useDragging이 참이다", () => {
    const { result } = renderHook(() => useDragging(), {
      wrapper: wrapperOf(valueOf({ draggingId: "집힌것" })),
    });

    expect(result.current).toBe(true);
  });
});

describe("drag.context — 받는 자리는 제 차례만 본다", () => {
  it("남이 받고 있으면 idle이다", () => {
    const { result } = renderHook(() => useDropState("내자리"), {
      wrapper: wrapperOf(valueOf({ overId: "남의자리" })),
    });

    expect(result.current).toBe("idle");
  });

  it("아무도 안 받고 있으면 idle이다", () => {
    const { result } = renderHook(() => useDropState("내자리"), {
      wrapper: wrapperOf(valueOf()),
    });

    expect(result.current).toBe("idle");
  });

  it("내 위에 있고 받을 수 있으면 over다", () => {
    const { result } = renderHook(() => useDropState("내자리"), {
      wrapper: wrapperOf(valueOf({ overId: "내자리" })),
    });

    expect(result.current).toBe("over");
  });

  it("내 위에 있어도 못 받으면 over-blocked다", () => {
    const { result } = renderHook(() => useDropState("내자리"), {
      wrapper: wrapperOf(valueOf({ overId: "내자리", blocked: true })),
    });

    expect(result.current).toBe("over-blocked");
  });
});
