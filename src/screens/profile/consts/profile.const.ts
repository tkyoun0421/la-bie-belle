import type { Theme } from "@/shared/model/theme.type";

/** 테마 셋의 이름이다 — 줄의 오른쪽 값과 시트의 선택지가 같은 말을 쓴다. */
export const THEME_LABEL: Record<Theme, string> = {
  system: "기기 설정대로",
  light: "밝게",
  dark: "어둡게",
};

/** 시트에 서는 순서다 — 기기 설정이 기본값이라 맨 위다. */
export const THEME_CHOICES: readonly Theme[] = ["system", "light", "dark"];
