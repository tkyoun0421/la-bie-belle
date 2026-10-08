import { Check, Info } from "lucide-react-native";
import { View, type ViewProps } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const TOAST_ICON_SIZE = 16;

const TOAST_ICON_STROKE_WIDTH = 3.2;

export type ToastKind = "success" | "info";

export type ToastProps = ViewProps & {
  kind?: ToastKind;
  distance?: number;
  testID?: string;
};

const ICONS = {
  success: {
    icon: Check,
    className: "fill-fg-positive-contrast text-fg-positive-contrast",
  },
  info: { icon: Info, className: "fill-fg-sky-contrast text-fg-sky-contrast" },
} as const;

export function Toast({
  kind = "success",
  distance = 0,
  className,
  children,
  testID,
  style,
  ...rest
}: ToastProps) {
  const mark = ICONS[kind];

  return (
    <View
      testID={testID}
      style={[style, { transform: [{ translateY: distance }] }]}
      className={cn(
        "flex-row items-center gap-2 self-center rounded-lg bg-bg-neutral-solid-soft px-4 py-3",
        className,
      )}
      {...rest}
    >
      <Icon
        icon={mark.icon}
        size={TOAST_ICON_SIZE}
        strokeWidth={TOAST_ICON_STROKE_WIDTH}
        className={mark.className}
      />
      <Text numberOfLines={1} className="text-sm text-fg-neutral-contrast">
        {children}
      </Text>
    </View>
  );
}
