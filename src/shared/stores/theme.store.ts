import { create } from "zustand";
import {
  applyColorScheme,
  readStoredTheme,
  writeStoredTheme,
} from "@/shared/lib/themeStorage.lib";
import type { Theme } from "@/shared/model/theme.type";
import { parseStoredTheme } from "@/shared/utils/theme.utils";

type ThemeStore = {
  theme: Theme;
  restored: boolean;
  restore: () => Promise<void>;
  choose: (theme: Theme) => void;
};

export const useTheme = create<ThemeStore>((set) => ({
  theme: "system",
  restored: false,

  async restore() {
    const theme = parseStoredTheme(await readStoredTheme());

    applyColorScheme(theme);
    set({ theme, restored: true });
  },

  choose(theme) {
    applyColorScheme(theme);
    set({ theme });
    writeStoredTheme(theme);
  },
}));
