import { type FontSource } from "expo-font";
/* eslint-disable no-restricted-imports -- assets/ 는 src/ 밖이라 @/ 로 가리킬 수 없고,
   Metro는 서체 경로를 정적으로 읽으니 별칭 없이 리터럴 상대 경로로 물려야 한다. */
import type { FontFamilyName } from "@/shared/model/font.type";
import wantedSansBold from "../../../assets/fonts/subset/WantedSans-Bold.ttf";
import wantedSansMedium from "../../../assets/fonts/subset/WantedSans-Medium.ttf";
import wantedSansRegular from "../../../assets/fonts/subset/WantedSans-Regular.ttf";
import wantedSansSemiBold from "../../../assets/fonts/subset/WantedSans-SemiBold.ttf";
/* eslint-enable no-restricted-imports */

export const FONT_ASSETS: Record<string, string> = {
  "WantedSans-Regular": "assets/fonts/subset/WantedSans-Regular.ttf",
  "WantedSans-Medium": "assets/fonts/subset/WantedSans-Medium.ttf",
  "WantedSans-SemiBold": "assets/fonts/subset/WantedSans-SemiBold.ttf",
  "WantedSans-Bold": "assets/fonts/subset/WantedSans-Bold.ttf",
} satisfies Record<FontFamilyName, string>;

export const FONT_SOURCES: Record<FontFamilyName, FontSource> = {
  "WantedSans-Regular": wantedSansRegular,
  "WantedSans-Medium": wantedSansMedium,
  "WantedSans-SemiBold": wantedSansSemiBold,
  "WantedSans-Bold": wantedSansBold,
};
