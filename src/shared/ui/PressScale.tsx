import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DURATION_FAST_MS, PRESS_SCALE } from "@/shared/consts/motion.const";
import { EASE_OUT } from "@/shared/lib/motionEasing.lib";

const RESTING_SCALE = 1;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressScaleProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
};

export function PressScale({
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: PressScaleProps) {
  const scale = useSharedValue(RESTING_SCALE);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const scaleTo = (toValue: number) => {
    scale.value = withTiming(toValue, {
      duration: DURATION_FAST_MS,
      easing: EASE_OUT,
      reduceMotion: ReduceMotion.Never,
    });
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[style, scaleStyle]}
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
  );
}
