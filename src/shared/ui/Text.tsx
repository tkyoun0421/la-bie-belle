import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@/shared/lib/utils";

/**
 * 글자를 그리는 한 자리다. 화면 파일은 `maxFontSizeMultiplier`를 적지 않는다 — 상한을 여기서만
 * 걸어야 빠뜨린 자리가 안 생긴다.
 *
 * 값의 정본은 `docs/2-design/design-system/tokens.md`의 「글자 배율 상한」이다. 기기 배율이
 * 그보다 커도 이 값까지만 곱해진다.
 *
 * **크기와 색과 굵기를 prop으로 받는다.** 화면이 `text-sm text-fg-neutral-subtle`을 직접 적지
 * 않고 `size="sm" tone="subtle"`이라고 말한다 — [components.md]가 「개발자가 색을 고르지
 * 않아도 되게」라고 적은 그 자리고, 규칙 19(`house/no-visual-utility-class`)가 화면에서 그
 * 유틸리티를 막는 근거도 같다. 어느 토큰이 붙는지는 아래 표 셋이 혼자 안다.
 *
 * 크기와 색을 나눠 받는 것은 Tailwind가 `text-`라는 한 접두사에 둘을 실어서다. 화면 쪽에서는
 * 한 글자열에 섞여 무엇이 크기고 무엇이 색인지 안 갈리는데, prop으로 갈라두면 그 둘이 이름부터
 * 다른 것이 된다.
 *
 * `numeric`은 숫자가 줄마다 흔들리지 않게 폭을 고정한다
 * (`foundation/typography.md`의 「숫자 정렬」). 날짜·금액·전화번호가 그 자리다.
 */

export const MAX_FONT_SIZE_MULTIPLIER = 1.3;

export type TextSize =
  "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

export type TextTone =
  | "neutral"
  | "muted"
  | "subtle"
  | "disabled"
  | "brand"
  | "contrast"
  | "positive"
  | "critical";

export type TextWeight = "regular" | "medium" | "semibold" | "bold";

const SIZES: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
};

const TONES: Record<TextTone, string> = {
  neutral: "text-fg-neutral",
  muted: "text-fg-neutral-muted",
  subtle: "text-fg-neutral-subtle",
  disabled: "text-fg-neutral-disabled",
  brand: "text-fg-brand",
  contrast: "text-fg-neutral-contrast",
  positive: "text-fg-positive",
  critical: "text-fg-critical",
};

/** `regular`가 빈 문자열인 것은 기본 굵기를 덮어쓰지 않으려는 것이다. */
const WEIGHTS: Record<TextWeight, string> = {
  regular: "",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export type TextProps = RNTextProps & {
  size?: TextSize;
  tone?: TextTone;
  weight?: TextWeight;
  numeric?: boolean;
};

export function Text({
  size = "base",
  tone = "neutral",
  weight = "regular",
  numeric = false,
  maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER,
  className,
  ...rest
}: TextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      className={cn(
        SIZES[size],
        TONES[tone],
        WEIGHTS[weight],
        numeric && "tabular-nums",
        className,
      )}
      {...rest}
    />
  );
}
