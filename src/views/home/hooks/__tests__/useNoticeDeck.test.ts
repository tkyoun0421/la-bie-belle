import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNoticeDeck } from "@/views/home/hooks/useNoticeDeck";

const TODAY = "2026-08-18";
const TOMORROW = "2026-08-19";
const THREE_NOTICES = ["notice-1", "notice-2", "notice-3"];

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("useNoticeDeck (위험 기반 테스트 21·22 — 상태의 자리)", () => {
  it("첫 장이 현재 카드이고 남은 개수는 전체 장수다", () => {
    const { result } = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    expect(result.current.currentId).toBe("notice-1");
    expect(result.current.remainingCount).toBe(3);
    expect(result.current.phase).toBe("idle");
  });

  it("dismiss()는 다음 카드로 넘기고 남은 개수를 하나 줄이며 phase를 entering으로 바꾼다", () => {
    const { result } = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.currentId).toBe("notice-2");
    expect(result.current.remainingCount).toBe(2);
    expect(result.current.phase).toBe("entering");
  });

  it("settle()을 부르면 phase가 idle로 돌아온다", () => {
    const { result } = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      result.current.dismiss();
    });
    act(() => {
      result.current.settle();
    });

    expect(result.current.phase).toBe("idle");
  });

  it("마지막 장을 끄면 currentId가 없어지고 남은 개수는 0이다 — 접힘 판정 자체는 하지 않는다", () => {
    const { result } = renderHook(() => useNoticeDeck(["only-one"], TODAY));

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.currentId).toBeNull();
    expect(result.current.remainingCount).toBe(0);
    expect(result.current).not.toHaveProperty("collapsed");
  });

  it("전환 중(entering, settle 전) 연타는 무시되어 카드가 한 장씩만 넘어간다", () => {
    const { result } = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      result.current.dismiss();
      result.current.dismiss();
      result.current.dismiss();
    });

    expect(result.current.currentId).toBe("notice-2");
    expect(result.current.remainingCount).toBe(2);
  });

  it("settle 뒤에는 다시 dismiss가 먹혀 그다음 카드로 한 장 더 넘어간다", () => {
    const { result } = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      result.current.dismiss();
    });
    act(() => {
      result.current.settle();
    });
    act(() => {
      result.current.dismiss();
    });

    expect(result.current.currentId).toBe("notice-3");
    expect(result.current.remainingCount).toBe(1);
  });

  it("끈 카드는 기기에 저장돼 같은 날 재마운트해도 다시 뜨지 않는다", () => {
    const first = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      first.result.current.dismiss();
    });
    first.unmount();

    const second = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    expect(second.result.current.currentId).toBe("notice-2");
    expect(second.result.current.remainingCount).toBe(2);
  });

  it("끄기는 그날 하루만 미루는 것이라 다음 날에는 다시 뜬다", () => {
    const first = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      first.result.current.dismiss();
    });
    first.unmount();

    const nextDay = renderHook(() => useNoticeDeck(THREE_NOTICES, TOMORROW));

    expect(nextDay.result.current.currentId).toBe("notice-1");
    expect(nextDay.result.current.remainingCount).toBe(3);
  });
});

describe("useNoticeDeck (인수 조건 39, 라운드 38 #6 — 퇴장 애니메이션이 돌 자리를 훅이 노출한다)", () => {
  it("dismiss()는 방금 끈 카드를 leavingId로 남기고 currentId는 그대로 다음 카드로 넘어간다", () => {
    const { result } = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.leavingId).toBe("notice-1");
    expect(result.current.currentId).toBe("notice-2");
  });

  it("settle()을 부르면 phase뿐 아니라 leavingId도 함께 비워진다", () => {
    const { result } = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      result.current.dismiss();
    });
    act(() => {
      result.current.settle();
    });

    expect(result.current.leavingId).toBeNull();
    expect(result.current.phase).toBe("idle");
  });

  it("마지막 카드를 끄면 currentId는 곧바로 null이어도 leavingId는 settle 전까지 남는다 — 슬롯 접힘의 경계값", () => {
    const { result } = renderHook(() => useNoticeDeck(["only-one"], TODAY));

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.currentId).toBeNull();
    expect(result.current.leavingId).toBe("only-one");

    act(() => {
      result.current.settle();
    });

    expect(result.current.leavingId).toBeNull();
  });

  it("전환 중 연타는 leavingId가 채워져 있어도 여전히 무시된다 — 기존 transitioningRef 성질 유지", () => {
    const { result } = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      result.current.dismiss();
      result.current.dismiss();
      result.current.dismiss();
    });

    expect(result.current.currentId).toBe("notice-2");
    expect(result.current.leavingId).toBe("notice-1");
    expect(result.current.remainingCount).toBe(2);
  });

  it("settle 뒤 다음 dismiss는 그때의 카드를 새 leavingId로 남긴다", () => {
    const { result } = renderHook(() => useNoticeDeck(THREE_NOTICES, TODAY));

    act(() => {
      result.current.dismiss();
    });
    act(() => {
      result.current.settle();
    });
    act(() => {
      result.current.dismiss();
    });

    expect(result.current.leavingId).toBe("notice-2");
    expect(result.current.currentId).toBe("notice-3");
  });
});

describe("useNoticeDeck (위험 기반 테스트 21·22 — 첫 렌더는 localStorage와 무관해야 한다)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("localStorage가 비어 있어도 첫 렌더의 currentId는 null이고, 마운트 뒤에는 notice-1이다", () => {
    const snapshots: (string | null)[] = [];
    const { result } = renderHook(() => {
      const deck = useNoticeDeck(THREE_NOTICES, TODAY);
      snapshots.push(deck.currentId);
      return deck;
    });

    expect(snapshots[0]).toBeNull();
    expect(result.current.currentId).toBe("notice-1");
  });

  it("끈 목록이 저장돼 있어도 첫 렌더의 currentId는 null이고, 마운트 뒤에는 notice-2다", () => {
    window.localStorage.setItem(
      "labiebelle:home-notice-deck:2026-08-18",
      JSON.stringify(["notice-1"]),
    );

    const snapshots: (string | null)[] = [];
    const { result } = renderHook(() => {
      const deck = useNoticeDeck(THREE_NOTICES, TODAY);
      snapshots.push(deck.currentId);
      return deck;
    });

    expect(snapshots[0]).toBeNull();
    expect(result.current.currentId).toBe("notice-2");
  });

  it("첫 렌더 중에는 localStorage.getItem을 호출하지 않는다", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    const callCountsAtRender: number[] = [];

    renderHook(() => {
      const deck = useNoticeDeck(THREE_NOTICES, TODAY);
      callCountsAtRender.push(getItemSpy.mock.calls.length);
      return deck;
    });

    expect(callCountsAtRender[0]).toBe(0);
  });
});
