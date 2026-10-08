import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "react-native-css";
import { THEME_STORAGE_KEY } from "@/shared/consts/theme.const";
import type { Theme } from "@/shared/model/theme.type";
import { toColorScheme } from "@/shared/utils/theme.utils";

export async function readStoredTheme(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: Theme): void {
  void AsyncStorage.setItem(THEME_STORAGE_KEY, theme).catch(() => {});
}

export function applyColorScheme(theme: Theme): void {
  colorScheme.set(toColorScheme(theme));
}
