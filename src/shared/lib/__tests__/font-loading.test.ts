import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  FONT_ASSETS,
  shouldDismissSplash,
  shouldRenderApp,
} from "@/shared/lib/font-loading";

const GLOBALS_CSS_PATH = path.join(process.cwd(), "src/app/globals.css");

/** 번들에 들어가는 것은 서브셋뿐이다 — 원본은 다시 만들 때만 쓴다. */
const FONTS_DIR = path.join(process.cwd(), "assets/fonts/subset");

const EXPECTED_FONT_KEYS = [
  "WantedSans-Regular",
  "WantedSans-Medium",
  "WantedSans-SemiBold",
  "WantedSans-Bold",
];

function fontFamilyVariableValue(
  globalsCss: string,
  cssVariableName: string,
): string {
  const match = globalsCss.match(
    new RegExp(`--${cssVariableName}:\\s*"([^"]+)"`),
  );
  if (!match) {
    throw new Error(`${cssVariableName} 값을 globals.css에서 못 찾았다`);
  }

  return match[1];
}

describe("FONT_ASSETS — useFonts 호출부가 literal require로 옮길 서체 이름 → 자산 경로 맵", () => {
  it("맵의 키가 Wanted Sans 파일 이름 넷과 정확히 같다", () => {
    expect(Object.keys(FONT_ASSETS).sort()).toEqual(
      [...EXPECTED_FONT_KEYS].sort(),
    );
  });

  it.each([
    ["font-sans", "WantedSans-Regular"],
    ["font-medium", "WantedSans-Medium"],
    ["font-semibold", "WantedSans-SemiBold"],
    ["font-bold", "WantedSans-Bold"],
  ])(
    "globals.css의 --%s 값이 FONT_ASSETS의 키 %s와 문자열이 같다",
    (cssVariableName, expectedKey) => {
      const globalsCss = readFileSync(GLOBALS_CSS_PATH, "utf8");
      const cssValue = fontFamilyVariableValue(globalsCss, cssVariableName);

      expect(expectedKey in FONT_ASSETS).toBe(true);
      expect(cssValue).toBe(expectedKey);
    },
  );

  it.each(EXPECTED_FONT_KEYS)(
    "%s 키의 경로가 실제 assets/fonts/subset/%s.ttf를 가리킨다 — 다른 굵기 파일을 잘못 물리면 여기서 잡힌다",
    (fontKey) => {
      const resolvedPath = path.join(process.cwd(), FONT_ASSETS[fontKey]);

      expect(resolvedPath).toBe(path.join(FONTS_DIR, `${fontKey}.ttf`));
      expect(existsSync(resolvedPath)).toBe(true);
    },
  );
});

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
});
