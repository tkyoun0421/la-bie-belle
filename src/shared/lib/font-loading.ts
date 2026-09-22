import { type FontSource } from "expo-font";
/* eslint-disable no-restricted-imports -- assets/ 는 src/ 밖이라 @/ 로 가리킬 수 없고,
   Metro는 서체 경로를 정적으로 읽으니 별칭 없이 리터럴 상대 경로로 물려야 한다. */
import wantedSansBold from "../../../assets/fonts/subset/WantedSans-Bold.ttf";
import wantedSansMedium from "../../../assets/fonts/subset/WantedSans-Medium.ttf";
import wantedSansRegular from "../../../assets/fonts/subset/WantedSans-Regular.ttf";
import wantedSansSemiBold from "../../../assets/fonts/subset/WantedSans-SemiBold.ttf";
/* eslint-enable no-restricted-imports */

export type FontFamilyName =
  | "WantedSans-Regular"
  | "WantedSans-Medium"
  | "WantedSans-SemiBold"
  | "WantedSans-Bold";

export type FontLoadingState = {
  loaded: boolean;
  error: Error | null;
};

/**
 * 키는 globals.css의 --font-sans·--font-medium·--font-semibold·--font-bold 값과
 * 글자까지 같아야 한다 — 어긋나면 유틸이 없는 서체를 물고 기본 서체로 떨어진다.
 * 값을 불러온 자산이 아니라 저장소 뿌리 기준 경로로 두는 이유는 Jest의 에셋
 * 트랜스포머가 어떤 .ttf든 1로 바꿔서 자산 값으로는 굵기 오배선을 못 잡기 때문이다.
 */
export const FONT_ASSETS: Record<string, string> = {
  "WantedSans-Regular": "assets/fonts/subset/WantedSans-Regular.ttf",
  "WantedSans-Medium": "assets/fonts/subset/WantedSans-Medium.ttf",
  "WantedSans-SemiBold": "assets/fonts/subset/WantedSans-SemiBold.ttf",
  "WantedSans-Bold": "assets/fonts/subset/WantedSans-Bold.ttf",
} satisfies Record<FontFamilyName, string>;

/**
 * useFonts에 그대로 넘기는 맵이다. 경로를 위 맵과 두 번 적는 대신 둘을 나란히 둬서
 * 키가 어긋나면 눈에 걸리게 한다.
 */
export const FONT_SOURCES: Record<FontFamilyName, FontSource> = {
  "WantedSans-Regular": wantedSansRegular,
  "WantedSans-Medium": wantedSansMedium,
  "WantedSans-SemiBold": wantedSansSemiBold,
  "WantedSans-Bold": wantedSansBold,
};

export function shouldRenderApp({ loaded, error }: FontLoadingState): boolean {
  return loaded || error !== null;
}

export function shouldDismissSplash(
  state: FontLoadingState,
  alreadyDismissed: boolean,
): boolean {
  return !alreadyDismissed && shouldRenderApp(state);
}
