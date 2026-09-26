import { View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 글자 한둘로 상태를 말하는 작은 면이다.
 *
 * 모양이 버튼보다 한 단계 아래인 `rounded-sm`인 것은 높이가 24px이라 14px을 주면 다시 알약이
 * 되기 때문이다.
 *
 * **warning만 글자가 `fg.neutral`이다.** 다른 변형처럼 같은 계열의 `fg`를 쓸 수 없어서다.
 *
 * 한 줄에 배지를 셋 이상 붙이지 않는다. 배지가 많아지면 배지가 정보가 아니라 소음이 된다.
 */

export type BadgeVariant =
  "neutral" | "brand" | "positive" | "critical" | "sky" | "warning";

const VARIANTS: Record<BadgeVariant, { surface: string; label: string }> = {
  neutral: { surface: "bg-bg-neutral-weak", label: "text-fg-neutral-muted" },
  brand: { surface: "bg-bg-brand-weak", label: "text-fg-brand" },
  positive: { surface: "bg-bg-positive-weak", label: "text-fg-positive" },
  critical: { surface: "bg-bg-critical-weak", label: "text-fg-critical" },
  sky: { surface: "bg-bg-sky-weak", label: "text-fg-sky" },
  warning: { surface: "bg-bg-warning-weak", label: "text-fg-neutral" },
};

export type BadgeProps = ViewProps & {
  variant?: BadgeVariant;
  label: string;
};

export function Badge({
  variant = "neutral",
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
        "self-start rounded-sm px-2 py-0.5",
        tone.surface,
        className,
      )}
      {...rest}
    >
      <Text className={cn("font-medium text-xs", tone.label)}>{label}</Text>
    </View>
  );
}
