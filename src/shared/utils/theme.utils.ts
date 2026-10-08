import { THEMES } from "@/shared/consts/theme.const";
import type { Theme, ThemeColorScheme } from "@/shared/model/theme.type";

export function parseStoredTheme(raw: string | null): Theme {
  return THEMES.includes(raw as Theme) ? (raw as Theme) : "system";
}

export function toColorScheme(theme: Theme): ThemeColorScheme {
  return theme === "system" ? null : theme;
}
