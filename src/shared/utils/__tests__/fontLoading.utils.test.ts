import {
  shouldDismissSplash,
  shouldRenderApp,
} from "@/shared/utils/fontLoading.utils";

describe("shouldRenderApp — 서체 로딩 상태로 화면을 그릴지 정한다", () => {
  it("로딩이 끝나지 않았으면 그리지 않는다", () => {
    expect(shouldRenderApp({ loaded: false, error: null })).toBe(false);
  });

  it("로딩이 끝났으면 그린다", () => {
    expect(shouldRenderApp({ loaded: true, error: null })).toBe(true);
  });

  it("로딩이 실패해도 그린다 — 서체 없이 그려야 앱이 벽돌이 안 된다", () => {
    const failedState = {
      loaded: false,
      error: new Error("font load failed"),
    };

    expect(shouldRenderApp(failedState)).toBe(true);
  });
});

describe("shouldDismissSplash — 스플래시를 정확히 한 번만 내린다", () => {
  it("로딩이 끝나지 않은 동안은 내리지 않는다", () => {
    expect(shouldDismissSplash({ loaded: false, error: null }, false)).toBe(
      false,
    );
  });

  it("로딩이 끝나고 아직 안 내렸으면 내린다", () => {
    expect(shouldDismissSplash({ loaded: true, error: null }, false)).toBe(
      true,
    );
  });

  it("로딩이 실패해도 내린다 — 실패가 스플래시에 영원히 가두지 않는다", () => {
    const failedState = {
      loaded: false,
      error: new Error("font load failed"),
    };

    expect(shouldDismissSplash(failedState, false)).toBe(true);
  });

  it("이미 내렸으면 로딩이 끝난 상태라도 다시 내리라 하지 않는다", () => {
    expect(shouldDismissSplash({ loaded: true, error: null }, true)).toBe(
      false,
    );
  });

  it("테마 복원이 안 끝났으면 서체 로딩이 끝나도 내리지 않는다", () => {
    expect(
      shouldDismissSplash({ loaded: true, error: null }, false, false),
    ).toBe(false);
  });

  it("서체 로딩과 테마 복원이 둘 다 끝나면 내린다", () => {
    expect(
      shouldDismissSplash({ loaded: true, error: null }, false, true),
    ).toBe(true);
  });

  it("이미 내렸으면 테마 복원이 안 끝났어도 다시 내리라 하지 않는다", () => {
    expect(
      shouldDismissSplash({ loaded: true, error: null }, true, false),
    ).toBe(false);
  });
});
