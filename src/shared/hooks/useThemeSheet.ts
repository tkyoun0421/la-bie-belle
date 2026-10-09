import { useCallback } from "react";
import {
  THEMES,
  THEME_LABEL,
  THEME_SHEET_TITLE,
} from "@/shared/consts/theme.const";
import type { Theme } from "@/shared/model/theme.type";
import { useTheme } from "@/shared/stores/theme.store";

export type ThemeChoice = {
  value: Theme;
  label: string;
  selected: boolean;
};

export type ThemeSheetController = {
  title: string;
  choices: ThemeChoice[];
  choose: (theme: Theme) => void;
};

export function useThemeSheet(onChosen: () => void): ThemeSheetController {
  const theme = useTheme((at) => at.theme);
  const setTheme = useTheme((at) => at.choose);

  const choose = useCallback(
    (chosen: Theme) => {
      setTheme(chosen);
      onChosen();
    },
    [setTheme, onChosen],
  );

  return {
    title: THEME_SHEET_TITLE,
    choices: THEMES.map((value) => ({
      value,
      label: THEME_LABEL[value],
      selected: value === theme,
    })),
    choose,
  };
}
