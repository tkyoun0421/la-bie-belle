import { existsSync } from "node:fs";
import { join } from "node:path";

const { GOOGLE_BUTTON_ASSETS } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/screens/login/consts/login.const"
);

const GOOGLE_ASSET_DIR = join(process.cwd(), "assets", "google");

describe("GOOGLE_BUTTON_ASSETS — 테마마다 반대 톤의 자산을 고른다", () => {
  it("플랫폼 둘에 light와 dark 칸이 다 있다", () => {
    for (const platform of ["ios", "android"]) {
      expect(typeof GOOGLE_BUTTON_ASSETS[platform].light).toBe("string");
      expect(typeof GOOGLE_BUTTON_ASSETS[platform].dark).toBe("string");
    }
  });

  it.each(["ios", "android"])(
    "%s의 light 칸은 Dark 자산을 가리킨다",
    (platform) => {
      expect(GOOGLE_BUTTON_ASSETS[platform].light).toContain("dark");
    },
  );

  it.each(["ios", "android"])(
    "%s의 dark 칸은 Light 자산을 가리킨다",
    (platform) => {
      expect(GOOGLE_BUTTON_ASSETS[platform].dark).toContain("light");
    },
  );

  it.each([
    ["ios", "light"],
    ["ios", "dark"],
    ["android", "light"],
    ["android", "dark"],
  ])("%s %s 칸의 파일이 assets/google에 실재한다", (platform, theme) => {
    const name: string = GOOGLE_BUTTON_ASSETS[platform][theme];

    expect(existsSync(join(GOOGLE_ASSET_DIR, name))).toBe(true);
  });
});
