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
 *
 * **크기가 둘이다.** `sm`은 목록과 카드 안에서 값 옆에 붙는 기본이고, `md`는 한 장면 화면의
 * 제목 위에 홀로 서는 상태 배지다([login.md]의 「승인 대기 여백과 모양」이 `h-8` `px-3`을
 * 든다). 홀로 설 때 24px이면 화면 가운데의 제목 옆에서 부스러기로 읽힌다.
 *
 * **점은 「지금 바뀌는 중」이라는 뜻이다.** 상태가 곧 갈릴 자리에만 켠다 — 승인 대기가 그
 * 자리고, 거절된 뒤에는 기다리는 중이 아니라서 점을 끈다. 점 색은 그 배지 글자와 같은 계열의
 * 진한 면이고, 브랜드만 [login.md]가 `bg.brand-solid`로 따로 짚어서 그 값을 쓴다.
 */

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
