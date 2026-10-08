import { View, type ViewProps } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

export type BadgeVariant =
  "neutral" | "brand" | "positive" | "critical" | "sky" | "warning";

export type BadgeSize = "sm" | "md";

const VARIANTS: Record<
  BadgeVariant,
  { surface: string; label: string; dot: string }
> = {
  neutral: {
    surface: "bg-bg-neutral-weak",
    label: "text-fg-neutral-muted",
    dot: "bg-fg-neutral-muted",
  },
  brand: {
    surface: "bg-bg-brand-weak",
    label: "text-fg-brand",
    dot: "bg-bg-brand-solid",
  },
  positive: {
    surface: "bg-bg-positive-weak",
    label: "text-fg-positive",
    dot: "bg-fg-positive",
  },
  critical: {
    surface: "bg-bg-critical-weak",
    label: "text-fg-critical",
    dot: "bg-bg-critical-solid",
  },
  sky: {
    surface: "bg-bg-sky-weak",
    label: "text-fg-sky",
    dot: "bg-fg-sky",
  },
  warning: {
    surface: "bg-bg-warning-weak",
    label: "text-fg-neutral",
    dot: "bg-fg-neutral",
  },
};

const SIZES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5",
  md: "h-8 px-3",
};

export type BadgeProps = ViewProps & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  label: string;
};

export function Badge({
  variant = "neutral",
  size = "sm",
  dot = false,
  label,
  className,
  testID,
  ...rest
}: BadgeProps) {
  const tone = VARIANTS[variant];

  return (
    <View
      testID={testID}
      className={cn(
        "flex-row items-center gap-2 self-start rounded-sm",
        SIZES[size],
        tone.surface,
        className,
      )}
      {...rest}
    >
      {dot ? (
        <View
          testID={testID ? `${testID}-dot` : undefined}
          className={cn("size-1.5 rounded-full", tone.dot)}
        />
      ) : null}
      <Text size="xs" weight="medium" className={tone.label}>
        {label}
      </Text>
    </View>
  );
}
