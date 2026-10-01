import { type FontSource } from "expo-font";
/* eslint-disable no-restricted-imports -- assets/ 는 src/ 밖이라 @/ 로 가리킬 수 없고,
   Metro는 서체 경로를 정적으로 읽으니 별칭 없이 리터럴 상대 경로로 물려야 한다. */
import type { FontFamilyName } from "@/shared/model/font.type";
import wantedSansBold from "../../../assets/fonts/subset/WantedSans-Bold.ttf";
import wantedSansMedium from "../../../assets/fonts/subset/WantedSans-Medium.ttf";
import wantedSansRegular from "../../../assets/fonts/subset/WantedSans-Regular.ttf";
import wantedSansSemiBold from "../../../assets/fonts/subset/WantedSans-SemiBold.ttf";
/* eslint-enable no-restricted-imports */

/**
 * 서체 넷이 어디 있고 무엇으로 불리는지다. 어느 기기에서 돌든 같은 값이라 `consts`가 집이다.
 *
 * 값을 불러온 자산이 아니라 저장소 뿌리 기준 경로로 두는 이유는 Jest의 에셋 트랜스포머가
 * 어떤 .ttf든 1로 바꿔서 자산 값으로는 굵기 오배선을 못 잡기 때문이다.
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
