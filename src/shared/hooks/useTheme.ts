import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "react-native-css";
import { create } from "zustand";
import {
  parseStoredTheme,
  THEME_STORAGE_KEY,
  toColorScheme,
  type Theme,
} from "@/shared/utils/theme";

/**
 * 고른 화면이 사는 자리 하나다. 고르는 곳은 「나」의 화면 줄이고 쓰는 곳은 앱 전체라,
 * 값을 화면이 들고 있으면 껍데기가 그것을 못 본다.
 *
 * **기기에 남고 계정에는 안 남는다.** 기기마다 화면 밝기가 다르고 같은 사람이 폰과
 * 태블릿에서 다르게 둘 수 있다 — `docs/2-design/modules/account/screens/profile.md`의
 * 「화면」이다.
 *
 * **복원이 끝났는지를 같이 든다.** 앱은 저장소를 읽기 전에도 그릴 수 있어서, 그대로 두면
 * 어둡게 고른 사람이 흰 화면을 한 번 보고 나서 어두워진다. 스플래시가 이 값을 셋째 조건으로
 * 기다린다(`shouldDismissSplash`).
 *
 * 저장소가 실패해도 앱은 선다 — 읽기가 실패하면 기본값으로 복원을 끝내고, 쓰기가 실패하면
 * 이번 실행 동안만 고른 값이 산다. 화면 색 하나 때문에 앱이 스플래시에 갇히지 않는다.
 */

type ThemeStore = {
  theme: Theme;
  restored: boolean;
  restore: () => Promise<void>;
  choose: (theme: Theme) => void;
};

async function readStoredTheme(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function apply(theme: Theme): void {
  colorScheme.set(toColorScheme(theme));
}

export const useTheme = create<ThemeStore>((set) => ({
  theme: "system",
  restored: false,

  async restore() {
    const theme = parseStoredTheme(await readStoredTheme());

    apply(theme);
    set({ theme, restored: true });
  },

  choose(theme) {
    apply(theme);
    set({ theme });
    void AsyncStorage.setItem(THEME_STORAGE_KEY, theme).catch(() => {});
  },
}));
