import { Pressable, type PressableProps } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { PRESS_DURATION_MS, PRESS_SCALE } from "@/shared/consts/motion.const";

const RESTING_SCALE = 1;

export type PressScaleProps = PressableProps;

export function PressScale({
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressScaleProps) {
  const scale = useSharedValue(RESTING_SCALE);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const scaleTo = (toValue: number) => {
    scale.value = withTiming(toValue, {
      duration: PRESS_DURATION_MS,
      reduceMotion: ReduceMotion.Never,
    });
  };

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={(event) => {
          if (!disabled) {
            scaleTo(PRESS_SCALE);
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          if (!disabled) {
            scaleTo(RESTING_SCALE);
          }
          onPressOut?.(event);
        }}
      />
    </Animated.View>
  );
}
