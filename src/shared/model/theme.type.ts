/**
 * 「화면」이 무엇으로 서는지 정하는 갈래다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`의 「화면」이다.
 *
 * `system`이 `null`로 옮겨지는 것은 NativeWind가 「덮지 않는다」를 그 값으로 받기 때문이다.
 */

export type Theme = "system" | "light" | "dark";

export type ThemeColorScheme = "light" | "dark" | null;
