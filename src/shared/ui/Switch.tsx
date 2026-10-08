import { Pressable, View, type PressableProps } from "react-native";
import { cn } from "@/shared/utils/cn";

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 20;
const THUMB_OFF_X = 2;
const THUMB_TRAVEL = 18;
const HIT_SLOP_Y = 9;

export type SwitchProps = Omit<PressableProps, "onPress" | "style"> & {
  value: boolean;
  onValueChange: (value: boolean) => void;
  className?: string;
  testID?: string;
};

export function Switch({
  value,
  onValueChange,
  className,
  testID,
  ...rest
}: SwitchProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={{ top: HIT_SLOP_Y, bottom: HIT_SLOP_Y }}
      onPress={() => onValueChange(!value)}
      style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
      className={cn(
        "justify-center rounded-full border",
        value
          ? "border-transparent bg-bg-neutral-solid"
          : "border-stroke-neutral-muted bg-bg-neutral-weak-pressed",
        className,
      )}
      {...rest}
    >
      <View
        testID={testID ? `${testID}-thumb` : undefined}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          marginLeft: value ? THUMB_OFF_X + THUMB_TRAVEL : THUMB_OFF_X,
        }}
        className="rounded-full bg-fg-neutral-contrast"
      />
    </Pressable>
  );
}
