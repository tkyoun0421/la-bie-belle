import type { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View, type ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const SELECTED_RADIUS = 10;

const TRACK_PADDING = 4;

const SLIDE_DURATION_MS = 125;

const SEGMENT_ICON_SIZE = 18;

export type SegmentOption =
  | { value: string; label: string }
  | { value: string; icon: LucideIcon; accessibilityLabel: string };

export type SegmentProps = Omit<ViewProps, "children"> & {
  options: readonly SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  testID?: string;
};

export function Segment({
  options,
  value,
  onChange,
  className,
  testID,
  ...rest
}: SegmentProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const faceWidth =
    trackWidth === 0 ? 0 : (trackWidth - TRACK_PADDING * 2) / options.length;
  const selectedAt = options.findIndex((option) => option.value === value);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(Math.max(selectedAt, 0) * faceWidth, {
          duration: SLIDE_DURATION_MS,
        }),
      },
    ],
  }));

  return (
    <View
      testID={testID}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      className={cn(
        "h-11 flex-row rounded-lg bg-bg-neutral-weak p-1",
        className,
      )}
      {...rest}
    >
      {faceWidth === 0 || selectedAt < 0 ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            faceStyle,
            {
              position: "absolute",
              left: TRACK_PADDING,
              top: TRACK_PADDING,
              width: faceWidth,
              borderRadius: SELECTED_RADIUS,
            },
          ]}
          className="h-9 bg-bg-neutral"
        />
      )}

      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            testID={testID ? `${testID}-${option.value}` : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={
              "icon" in option ? option.accessibilityLabel : undefined
            }
            onPress={() => onChange(option.value)}
            className="h-9 flex-1 items-center justify-center"
          >
            {"icon" in option ? (
              <Icon
                icon={option.icon}
                size={SEGMENT_ICON_SIZE}
                className={
                  selected ? "text-fg-neutral" : "text-fg-neutral-subtle"
                }
              />
            ) : (
              <Text
                className={cn(
                  "font-medium text-sm",
                  selected ? "text-fg-neutral" : "text-fg-neutral-subtle",
                )}
              >
                {option.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
