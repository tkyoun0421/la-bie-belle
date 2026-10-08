import type { LucideIcon } from "lucide-react-native";
import { Pressable, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const TAB_ICON_SIZE = 24;

const FILLED_TONE = "fill-fg-neutral text-fg-neutral";

const LINE_TONE = "fill-transparent text-fg-neutral-subtle";

export type TabBarItem = {
  key: string;
  label: string;
  icon: LucideIcon;
};

export type TabBarProps = Omit<ViewProps, "children"> & {
  items: readonly TabBarItem[];
  current: string;
  onSelect?: (key: string) => void;
};

export function TabBar({
  items,
  current,
  onSelect,
  className,
  style,
  ...rest
}: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[style, { paddingBottom: insets.bottom }]}
      className={cn(
        "min-h-14 flex-row border-t border-stroke-neutral bg-bg-neutral",
        className,
      )}
      {...rest}
    >
      {items.map((item) => {
        const here = item.key === current;
        const tone = here ? "text-fg-neutral" : "text-fg-neutral-subtle";
        const iconTone = here ? FILLED_TONE : LINE_TONE;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: here }}
            onPress={() => onSelect?.(item.key)}
            className="min-h-14 flex-1 items-center justify-center gap-1"
          >
            <Icon icon={item.icon} size={TAB_ICON_SIZE} className={iconTone} />
            <Text className={cn("text-xs", tone)}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
