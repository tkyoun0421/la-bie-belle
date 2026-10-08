import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@/shared/utils/cn";

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

export const TONE_CLASS: Record<TextTone, string> = {
  neutral: "text-fg-neutral",
  muted: "text-fg-neutral-muted",
  subtle: "text-fg-neutral-subtle",
  disabled: "text-fg-neutral-disabled",
  brand: "text-fg-brand",
  contrast: "text-fg-neutral-contrast",
  positive: "text-fg-positive",
  critical: "text-fg-critical",
};

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
        TONE_CLASS[tone],
        WEIGHTS[weight],
        numeric && "tabular-nums",
        className,
      )}
      {...rest}
    />
  );
}
