/**
 * 「화면」이 무엇으로 서는지 정하는 값 셋과, 그 값을 NativeWind가 아는 말로 옮기는 함수다.
 * 정본은 `docs/2-design/modules/account/screens/profile.md`의 「화면」이다.
 *
 * 값이 기기 저장소에 사니 모르는 글자가 돌아올 수 있다 — 옛 버전이 쓴 값이거나 저장소가
 * 비었거나다. 셋이 아니면 기본인 `system`으로 좁혀서, 저장소가 고장 나도 앱이 기기 설정을
 * 따르는 자리로 돌아온다.
 *
 * `system`이 `null`인 것은 NativeWind가 「덮지 않는다」를 그 값으로 받기 때문이다.
 */

export type Theme = "system" | "light" | "dark";

export type ThemeColorScheme = "light" | "dark" | null;

export const THEME_STORAGE_KEY = "theme";

export const THEMES: readonly Theme[] = ["system", "light", "dark"];

export function parseStoredTheme(raw: string | null): Theme {
  return THEMES.includes(raw as Theme) ? (raw as Theme) : "system";
}

export function toColorScheme(theme: Theme): ThemeColorScheme {
  return theme === "system" ? null : theme;
}
