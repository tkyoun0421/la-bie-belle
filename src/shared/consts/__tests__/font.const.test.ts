import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { FONT_ASSETS } from "@/shared/consts/font.const";

const GLOBALS_CSS_PATH = path.join(process.cwd(), "src/app/globals.css");

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
