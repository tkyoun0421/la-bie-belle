import { styled } from "nativewind";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
} from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

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
