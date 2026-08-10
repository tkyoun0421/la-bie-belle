import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useReducedMotion } from "@/shared/hooks/useReducedMotion";

type Listener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<Listener>();

  window.matchMedia = ((query: string) => {
    return {
      media: query,
      matches,
      addEventListener: (_event: string, listener: Listener) => {
        listeners.add(listener);
      },
      removeEventListener: (_event: string, listener: Listener) => {
        listeners.delete(listener);
      },
    } as unknown as MediaQueryList;
  }) as unknown as typeof window.matchMedia;

  return {
    setMatches(next: boolean) {
      matches = next;
      window.matchMedia = ((query: string) =>
        ({
          media: query,
          matches,
          addEventListener: (_event: string, listener: Listener) => listeners.add(listener),
          removeEventListener: (_event: string, listener: Listener) => listeners.delete(listener),
        }) as unknown as MediaQueryList) as unknown as typeof window.matchMedia;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
  };
}

describe("useReducedMotion", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    installMatchMedia(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("prefers-reduced-motion이 꺼져 있으면 false다", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("prefers-reduced-motion이 켜져 있으면 true다", () => {
    const control = installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    control.setMatches(true);
  });

  it("변경 이벤트가 오면 값을 갱신한다", () => {
    const control = installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      control.setMatches(true);
    });

    expect(result.current).toBe(true);
  });
});
