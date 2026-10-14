import { parseStoredTheme, toColorScheme } from "@/shared/utils/theme.utils";

describe("parseStoredTheme — 저장된 값을 테마 셋 중 하나로 좁힌다", () => {
  it("system을 그대로 돌려준다", () => {
    expect(parseStoredTheme("system")).toBe("system");
  });

  it("light를 그대로 돌려준다", () => {
    expect(parseStoredTheme("light")).toBe("light");
  });

  it("dark를 그대로 돌려준다", () => {
    expect(parseStoredTheme("dark")).toBe("dark");
  });

  it("null이면 system이다 — 기본은 기기 설정대로다", () => {
    expect(parseStoredTheme(null)).toBe("system");
  });

  it("모르는 문자열이면 system이다", () => {
    expect(parseStoredTheme("무지개")).toBe("system");
  });

  it("빈 문자열이면 system이다", () => {
    expect(parseStoredTheme("")).toBe("system");
  });
});

type Os = "light" | "dark" | "unspecified" | null | undefined;

describe("toColorScheme — 테마와 기기 설정에서 적용할 색 구성표를 정한다", () => {
  it.each<Os>(["light", "dark", null, undefined, "unspecified"])(
    "light는 기기 설정이 %s여도 light다",
    (os) => {
      expect(toColorScheme("light", os)).toBe("light");
    },
  );

  it.each<Os>(["light", "dark", null, undefined, "unspecified"])(
    "dark는 기기 설정이 %s여도 dark다",
    (os) => {
      expect(toColorScheme("dark", os)).toBe("dark");
    },
  );

  it("system은 기기가 dark면 dark다", () => {
    expect(toColorScheme("system", "dark")).toBe("dark");
  });

  it("system은 기기가 light면 light다", () => {
    expect(toColorScheme("system", "light")).toBe("light");
  });

  it.each<Os>([null, undefined, "unspecified"])(
    "system은 기기 설정을 모르면(%s) light다",
    (os) => {
      expect(toColorScheme("system", os)).toBe("light");
    },
  );
});
