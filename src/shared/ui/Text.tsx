import { Text as RNText, type TextProps } from "react-native";

/**
 * 글자를 그리는 한 자리다. 화면 파일은 `maxFontSizeMultiplier`를 적지 않는다 — 상한을 여기서만
 * 걸어야 빠뜨린 자리가 안 생긴다.
 *
 * 값의 정본은 `docs/2-design/design-system/tokens.md`의 「글자 배율 상한」이다. 기기 배율이
 * 그보다 커도 이 값까지만 곱해진다.
 */
export const MAX_FONT_SIZE_MULTIPLIER = 1.3;

export function Text({
  maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER,
  ...rest
}: TextProps) {
  return <RNText maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}
