import { Check, ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View, type PressableProps } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const ROW_ICON_SIZE = 20;

export type ListRowValueTone = "answer" | "preview" | "zero";

const VALUE_TONE_CLASSES: Record<ListRowValueTone, string> = {
  answer: "text-fg-neutral",
  preview: "text-fg-neutral-muted",
  zero: "text-fg-neutral-subtle",
};

export type ListRowProps = Omit<PressableProps, "children"> & {
  title: string;
  detail?: string;
  value?: string;
  valueTone?: ListRowValueTone;
  left?: ReactNode;
  right?: ReactNode;
  chevron?: boolean;
  selected?: boolean;
  unread?: boolean;
  divider?: boolean;
  className?: string;
  testID?: string;
};

export function ListRow({
  title,
  detail,
  value,
  valueTone,
  left,
  right,
  chevron = false,
  selected = false,
  unread = false,
  divider = false,
  className,
  testID,
  onPress,
  ...rest
}: ListRowProps) {
  const pressable = onPress !== undefined;
  const tone = valueTone ?? (chevron ? "preview" : "answer");

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!pressable}
      className={cn(
        "w-full flex-row items-center gap-3 py-4",
        divider && "border-t border-stroke-neutral",
        pressable && "active:bg-bg-neutral-weak-pressed",
        className,
      )}
      {...rest}
    >
      {unread ? (
        <View
          testID={testID ? `${testID}-unread` : undefined}
          className="h-2 w-2 rounded-full bg-bg-brand-solid"
        />
      ) : null}
      {left}
      <View className="flex-1 gap-1">
        <Text className="font-medium text-base text-fg-neutral">{title}</Text>
        {detail ? (
          <Text className="text-sm text-fg-neutral-subtle">{detail}</Text>
        ) : null}
      </View>
      {value ? (
        <Text className={cn("text-base", VALUE_TONE_CLASSES[tone])}>
          {value}
        </Text>
      ) : null}
      {right}
      {selected ? (
        <Icon icon={Check} size={ROW_ICON_SIZE} className="text-fg-brand" />
      ) : null}
      {chevron ? (
        <Icon
          icon={ChevronRight}
          size={ROW_ICON_SIZE}
          testID={testID ? `${testID}-chevron` : undefined}
          className="text-fg-neutral-subtle"
        />
      ) : null}
    </Pressable>
  );
}
