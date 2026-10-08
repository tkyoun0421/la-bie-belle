import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const CONTAINER_PADDING = 20;

export type BottomCTAProps = ViewProps & {
  scrollable?: boolean;
  note?: ReactNode;
};

export function BottomCTA({
  scrollable = false,
  note,
  className,
  children,
  style,
  ...rest
}: BottomCTAProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[style, { paddingBottom: CONTAINER_PADDING + insets.bottom }]}
      className={cn(
        "gap-2 bg-bg-neutral px-5 pt-5",
        scrollable && "border-t border-stroke-neutral",
        className,
      )}
      {...rest}
    >
      {typeof note === "string" ? (
        <Text className="text-center text-sm text-fg-neutral-subtle">
          {note}
        </Text>
      ) : (
        note
      )}
      {children}
    </View>
  );
}
