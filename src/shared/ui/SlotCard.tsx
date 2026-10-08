import type { ReactNode } from "react";
import { Pressable, View, type PressableProps } from "react-native";
import { cn } from "@/shared/utils/cn";

export type SlotCardVariant = "filled" | "empty";

export type SlotCardProps = Omit<PressableProps, "children"> & {
  variant?: SlotCardVariant;
  right?: ReactNode;
  children: ReactNode;
};

const VARIANTS: Record<SlotCardVariant, string> = {
  filled: "bg-bg-neutral-weak",
  empty: "border border-dashed border-stroke-neutral-muted",
};

export function SlotCard({
  variant = "empty",
  right,
  className,
  children,
  testID,
  ...rest
}: SlotCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      className={cn(
        "h-12 flex-row items-center gap-2 rounded-lg px-4",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
      {right === undefined ? null : (
        <View className="ml-auto flex-row items-center gap-2">{right}</View>
      )}
    </Pressable>
  );
}
