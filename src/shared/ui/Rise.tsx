import type { ReactNode } from "react";
import Animated, {
  ReduceMotion,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useReduceMotion } from "@/shared/hooks/useReduceMotion";
import { EASE_OUT } from "@/shared/lib/motionEasing.lib";
import { riseTimingOf } from "@/shared/utils/riseTiming.utils";

export type RiseProps = {
  index: number;
  className?: string;
  children: ReactNode;
};

export function Rise({ index, className, children }: RiseProps) {
  const { delayMs, durationMs, distance } = riseTimingOf(
    index,
    useReduceMotion(),
  );

  const entering = () => {
    "worklet";
    const settle = (toValue: number) =>
      withDelay(
        delayMs,
        withTiming(toValue, {
          duration: durationMs,
          easing: EASE_OUT,
          reduceMotion: ReduceMotion.Never,
        }),
        ReduceMotion.Never,
      );

    return {
      initialValues: { opacity: 0, transform: [{ translateY: distance }] },
      animations: {
        opacity: settle(1),
        transform: [{ translateY: settle(0) }],
      },
    };
  };

  return (
    <Animated.View entering={entering} className={className}>
      {children}
    </Animated.View>
  );
}
