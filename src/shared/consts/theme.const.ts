import type { Theme } from "@/shared/model/theme.type";

/**
 * 어느 기기에서 돌든 같은 글자다 — 환경이 바뀌어도 안 바뀌어 `consts`가 집이다.
 * 목록이 타입을 읽는 방향이고 그 반대는 아니다.
 */

export const THEME_STORAGE_KEY = "theme";

export const THEMES: readonly Theme[] = ["system", "light", "dark"];
