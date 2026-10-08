import { Bell } from "lucide-react-native";
import { Pressable, type PressableProps, View } from "react-native";
import { Icon } from "@/shared/ui/Icon";
import { cn } from "@/shared/utils/cn";

const BELL_ICON_SIZE = 28;

const BELL_HIT_SLOP = 8;

export type BellIconProps = Omit<PressableProps, "children"> & {
  unread?: boolean;
  testID?: string;
};

export function BellIcon({
  unread = false,
  className,
  testID,
  ...rest
}: BellIconProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={BELL_HIT_SLOP}
      testID={testID}
      className={cn("relative h-7 w-7 items-center justify-center", className)}
      {...rest}
    >
      <Icon icon={Bell} size={BELL_ICON_SIZE} className="text-fg-neutral" />
      {unread ? (
        <View
          testID={testID ? `${testID}-unread` : undefined}
          className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-bg-neutral bg-bg-brand-solid"
        />
      ) : null}
    </Pressable>
  );
}
