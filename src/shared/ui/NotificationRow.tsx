import { ChevronRight } from "lucide-react-native";
import { Pressable, View, type PressableProps } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const ROW_ICON_SIZE = 20;

export type NotificationRowProps = Omit<PressableProps, "children"> & {
  title: string;
  time: string;
  unread?: boolean;
  testID?: string;
};

export function NotificationRow({
  title,
  time,
  unread = false,
  className,
  testID,
  onPress,
  ...rest
}: NotificationRowProps) {
  const pressable = onPress !== undefined;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!pressable}
      className={cn(
        "min-h-14 w-full flex-row items-center py-3",
        pressable && "active:bg-bg-neutral-weak-pressed",
        className,
      )}
      {...rest}
    >
      {unread ? (
        <View
          testID={testID ? `${testID}-unread` : undefined}
          className="mr-2 h-2 w-2 rounded-full bg-bg-brand-solid"
        />
      ) : null}

      <Text
        numberOfLines={2}
        tone={unread ? "neutral" : "muted"}
        className="flex-1"
      >
        {title}
      </Text>

      <Text size="xs" tone="subtle" numeric className="ml-3">
        {time}
      </Text>

      {pressable ? (
        <Icon
          icon={ChevronRight}
          size={ROW_ICON_SIZE}
          testID={testID ? `${testID}-chevron` : undefined}
          className="ml-1.5 text-fg-neutral-subtle"
        />
      ) : null}
    </Pressable>
  );
}
