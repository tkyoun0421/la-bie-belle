import { styled } from "nativewind";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
} from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 누르는 것 한 벌이다. 변형과 높이만 고르면 색과 모서리가 따라오므로 화면은 색을 안 고른다.
 * 값의 정본은 `docs/2-design/design-system/components.md`의 「Button」절이고 라벨 글자는
 * `foundation/typography.md`의 「버튼 라벨」이다.
 *
 * 모서리는 높이가 정한다. 36·40·48은 `rounded-lg`로 한 가족이 되고, 32 이하에서는 그 곡률이
 * 절반에 가까워져 알약으로 읽히므로 `rounded-sm`으로 내린다. 글자 없이 아이콘만 든 정사각형은
 * 고정값을 주면 모서리만 깎인 네모가 되니 `rounded-full`이다.
 *
 * 비활성은 계열을 안 나눈다. primary든 destructive든 같은 회색이라, 눌리지 않는 버튼이
 * 원래 무슨 색이었는지를 화면이 기억할 필요가 없다. 테두리는 원래 두르던 변형에만 남는다 —
 * 없던 변형에 비활성이라고 선을 더하면 그 순간 버튼 높이가 2px 자란다.
 *
 * 스피너는 라벨이 서던 자리에 그대로 선다. 버튼 크기가 안 바뀌어야 보내는 동안 화면이 안 튄다.
 * `ActivityIndicator`는 색을 `color` prop으로 받아 className이 그대로 닿지 않으니, 아이콘과
 * 같은 방식으로 계산된 색을 그 prop에 옮긴다.
 */

const SMALL_BUTTON_HEIGHT = 32;

const Spinner = styled(ActivityIndicator, {
  className: { target: false, nativeStyleMapping: { color: "color" } },
});

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "destructive";

export type ButtonSize = "compact" | "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  square?: boolean;
  children?: ReactNode;
};

type ButtonLook = {
  surface: string;
  pressed: string;
  label: string;
  border: string;
};

const SIZES: Record<
  ButtonSize,
  { height: number; box: string; square: string; padding: string }
> = {
  compact: { height: 32, box: "h-8", square: "w-8", padding: "px-3" },
  sm: { height: 36, box: "h-9", square: "w-9", padding: "px-4" },
  md: { height: 40, box: "h-10", square: "w-10", padding: "px-4" },
  lg: { height: 48, box: "h-12", square: "w-12", padding: "px-5" },
};

const VARIANTS: Record<ButtonVariant, ButtonLook> = {
  primary: {
    surface: "bg-bg-brand-solid",
    pressed: "active:bg-bg-brand-solid-pressed",
    label: "text-fg-brand-contrast",
    border: "",
  },
  secondary: {
    surface: "bg-bg-neutral-weak",
    pressed: "active:bg-bg-neutral-weak-pressed",
    label: "text-fg-neutral",
    border: "",
  },
  outline: {
    surface: "",
    pressed: "active:bg-bg-neutral-weak",
    label: "text-fg-neutral",
    border: "border border-stroke-neutral",
  },
  ghost: {
    surface: "",
    pressed: "active:bg-bg-neutral-weak",
    label: "text-fg-neutral-muted",
    border: "",
  },
  destructive: {
    surface: "bg-bg-critical-solid",
    pressed: "active:bg-bg-critical-solid-pressed",
    label: "text-fg-brand-contrast",
    border: "",
  },
};

const DISABLED: ButtonLook = {
  surface: "bg-bg-neutral-disabled",
  pressed: "",
  label: "text-fg-neutral-disabled",
  border: "border border-stroke-neutral-disabled",
};

function lookOf(variant: ButtonVariant, disabled: boolean): ButtonLook {
  const enabled = VARIANTS[variant];

  if (!disabled) {
    return enabled;
  }

  return { ...DISABLED, border: enabled.border ? DISABLED.border : "" };
}

function radiusOf(size: ButtonSize, square: boolean): string {
  if (square) {
    return "rounded-full";
  }

  return SIZES[size].height <= SMALL_BUTTON_HEIGHT
    ? "rounded-sm"
    : "rounded-lg";
}

function contentOf(
  loading: boolean,
  label: string,
  children: ReactNode,
): ReactNode {
  if (loading) {
    return <Spinner className={label} />;
  }

  if (typeof children === "string") {
    return (
      <Text numberOfLines={1} className={cn("font-medium text-base", label)}>
        {children}
      </Text>
    );
  }

  return children;
}

export function Button({
  variant = "primary",
  size = "lg",
  loading = false,
  square = false,
  disabled = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const look = lookOf(variant, Boolean(disabled));
  const shape = SIZES[size];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={cn(
        "flex-row items-center justify-center gap-2",
        shape.box,
        square ? shape.square : shape.padding,
        radiusOf(size, square),
        look.surface,
        look.pressed,
        look.border,
        className,
      )}
      {...rest}
    >
      {contentOf(loading, look.label, children)}
    </Pressable>
  );
}
