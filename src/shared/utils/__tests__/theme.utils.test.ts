import { parseStoredTheme, toColorScheme } from "@/shared/utils/theme.utils";

// 기기 저장소 `theme` 값을 읽고 NativeWind의 colorScheme으로 잇는 순수 함수 둘.
// 정본은 `docs/2-design/modules/account/screens/profile.md`의 「화면」·「화면 고르기」다.

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

describe("toColorScheme — 테마 값을 NativeWind colorScheme 값으로 바꾼다", () => {
  it("system은 null이다 — null이 기기 추종을 뜻한다", () => {
    expect(toColorScheme("system")).toBeNull();
  });

  it("light는 light다", () => {
    expect(toColorScheme("light")).toBe("light");
  });

  it("dark는 dark다", () => {
    expect(toColorScheme("dark")).toBe("dark");
  });
});
