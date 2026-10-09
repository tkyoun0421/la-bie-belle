import type { Theme } from "@/shared/model/theme.type";

export const THEME_STORAGE_KEY = "theme";

export const THEMES: readonly Theme[] = ["system", "light", "dark"];

export const THEME_LABEL: Record<Theme, string> = {
  system: "기기 설정대로",
  light: "밝게",
  dark: "어둡게",
};

export const THEME_SHEET_TITLE = "화면";
