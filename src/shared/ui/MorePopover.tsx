import { Pressable, View, type ViewProps } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const MIN_WIDTH = 148;

export type MorePopoverProps = ViewProps & {
  open: boolean;
  testID?: string;
};

export function MorePopover({
  open,
  className,
  children,
  testID,
  style,
  ...rest
}: MorePopoverProps) {
  if (!open) {
    return null;
  }

  return (
    <View
      testID={testID}
      style={[{ minWidth: MIN_WIDTH }, style]}
      className={cn(
        "absolute top-full right-0 rounded-lg border border-stroke-neutral bg-bg-neutral p-1.5",
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}

export type MorePopoverItemProps = {
  label: string;
  onPress: () => void;
  irreversible?: boolean;
  className?: string;
  testID?: string;
};

export function MorePopoverItem({
  label,
  onPress,
  irreversible = false,
  className,
  testID,
}: MorePopoverItemProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        "rounded-md px-3 py-2.5 active:bg-bg-neutral-weak-pressed",
        className,
      )}
    >
      <Text
        className={cn(
          "text-sm",
          irreversible ? "text-fg-critical" : "text-fg-neutral",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
