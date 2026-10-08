import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View, type ViewProps } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const APPBAR_ICON_SIZE = 28;

const APPBAR_HIT_SLOP = 8;

export type AppBarKind = "title" | "hub";

export type AppBarProps = Omit<ViewProps, "children"> & {
  kind?: AppBarKind;
  title?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
};

const TITLE_CLASS: Record<AppBarKind, string> = {
  title: "text-lg font-semibold text-fg-neutral",
  hub: "text-sm text-fg-neutral-subtle",
};

export function AppBar({
  kind = "title",
  title,
  onBack,
  right,
  className,
  ...rest
}: AppBarProps) {
  return (
    <View
      className={cn(
        "min-h-11 flex-row items-center gap-2 bg-bg-neutral px-5 pt-1 pb-3",
        className,
      )}
      {...rest}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={APPBAR_HIT_SLOP}
          className="-ml-1.5"
        >
          <Icon
            icon={ChevronLeft}
            size={APPBAR_ICON_SIZE}
            className="text-fg-neutral"
          />
        </Pressable>
      ) : null}

      <View className="flex-1">
        {typeof title === "string" ? (
          <Text numberOfLines={1} className={TITLE_CLASS[kind]}>
            {title}
          </Text>
        ) : (
          title
        )}
      </View>

      {right ? (
        <View className="-mr-1.5 flex-row items-center gap-2">{right}</View>
      ) : null}
    </View>
  );
}
