import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "react-native-css";
import { THEME_STORAGE_KEY } from "@/shared/consts/theme.const";
import type { Theme } from "@/shared/model/theme.type";
import { toColorScheme } from "@/shared/utils/theme.utils";

/**
 * 고른 화면이 기기에 남고 돌아오는 자리다. store는 값을 들기만 하고 디스크와 네이티브에
 * 닿는 손은 여기다 — 가르지 않으면 store 테스트가 AsyncStorage와 NativeWind를 같이 흉내야
 * 한다.
 *
 * **셋 다 실패해도 앱은 선다.** 읽기가 실패하면 널을 돌려주고(부르는 쪽이 기본값으로 좁힌다),
 * 쓰기가 실패하면 이번 실행 동안만 고른 값이 산다. 화면 색 하나 때문에 앱이 스플래시에
 * 갇히지 않는다.
 */

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

/** NativeWind에 지금 화면을 알린다. `system`은 「덮지 않는다」라서 널로 간다. */
export function applyColorScheme(theme: Theme): void {
  colorScheme.set(toColorScheme(theme));
}
