import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "labiebelle:amount-masking";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.resetModules();
});

describe("useAmountMasking", () => {
  it("저장값이 없으면 자동 가림 기본값(켜짐)으로 시작한다", async () => {
    const { useAmountMasking } = await import("@/shared/hooks/useAmountMasking");

    expect(useAmountMasking.getState().autoMaskOnWorkday).toBe(true);
  });

  it("skipHydration이라 저장된 값이 있어도 명시적 수화 전 첫 상태는 기본값과 같다(SSR과 일치)", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { autoMaskOnWorkday: false }, version: 0 }),
    );

    const { useAmountMasking } = await import("@/shared/hooks/useAmountMasking");

    expect(useAmountMasking.persist.hasHydrated()).toBe(false);
    expect(useAmountMasking.getState().autoMaskOnWorkday).toBe(true);
  });

  it("rehydrate를 부르면 저장된 값을 반영한다", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { autoMaskOnWorkday: false }, version: 0 }),
    );

    const { useAmountMasking } = await import("@/shared/hooks/useAmountMasking");

    await useAmountMasking.persist.rehydrate();

    expect(useAmountMasking.persist.hasHydrated()).toBe(true);
    expect(useAmountMasking.getState().autoMaskOnWorkday).toBe(false);
  });

  it("저장소가 비어 있으면 rehydrate 후에도 기본값(켜짐)을 유지한다", async () => {
    const { useAmountMasking } = await import("@/shared/hooks/useAmountMasking");

    await useAmountMasking.persist.rehydrate();

    expect(useAmountMasking.getState().autoMaskOnWorkday).toBe(true);
  });

  it("설정을 바꾸면 상태와 저장소 양쪽에 반영된다", async () => {
    const { useAmountMasking } = await import("@/shared/hooks/useAmountMasking");

    useAmountMasking.getState().setAutoMaskOnWorkday(false);

    expect(useAmountMasking.getState().autoMaskOnWorkday).toBe(false);

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    expect(stored?.state?.autoMaskOnWorkday).toBe(false);
  });

  it("다른 화면 상태는 이 스토어에 올라가지 않는다 — 근무일 자동 가림 설정 하나만 갖는다", async () => {
    const { useAmountMasking } = await import("@/shared/hooks/useAmountMasking");

    expect(Object.keys(useAmountMasking.getState())).toEqual(
      expect.arrayContaining(["autoMaskOnWorkday", "setAutoMaskOnWorkday"]),
    );
    expect(Object.keys(useAmountMasking.getState())).toHaveLength(2);
  });
});
