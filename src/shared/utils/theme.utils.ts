import { THEMES } from "@/shared/consts/theme.const";
import type { Theme, ThemeColorScheme } from "@/shared/model/theme.type";

/**
 * 저장소에서 온 글자를 갈래로 좁히고, 그 갈래를 NativeWind가 아는 말로 옮긴다.
 *
 * 값이 기기 저장소에 사니 모르는 글자가 돌아올 수 있다 — 옛 버전이 쓴 값이거나 저장소가
 * 비었거나다. 셋이 아니면 기본인 `system`으로 좁혀서, 저장소가 고장 나도 앱이 기기 설정을
 * 따르는 자리로 돌아온다.
 */

export function parseStoredTheme(raw: string | null): Theme {
  return THEMES.includes(raw as Theme) ? (raw as Theme) : "system";
}

export function toColorScheme(theme: Theme): ThemeColorScheme {
  return theme === "system" ? null : theme;
}
