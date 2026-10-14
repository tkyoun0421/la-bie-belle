import { THEMES } from "@/shared/consts/theme.const";
import { memberOf } from "@/shared/model/memberOf.policy";
import type {
  OsColorScheme,
  Theme,
  ThemeColorScheme,
} from "@/shared/model/theme.type";

const isTheme = memberOf(THEMES);

export function parseStoredTheme(raw: string | null): Theme {
  return isTheme(raw) ? raw : "system";
}

export function toColorScheme(
  theme: Theme,
  os: OsColorScheme,
): ThemeColorScheme {
  if (theme !== "system") {
    return theme;
  }

  return os === "dark" ? "dark" : "light";
}
