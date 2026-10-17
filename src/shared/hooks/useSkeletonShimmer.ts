import { useEffect, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SHIMMER_INTERVAL_MS } from "@/shared/consts/motion.const";
import { useReduceMotion } from "@/shared/hooks/useReduceMotion";

const SHIMMER_WIDTH_RATIO = 1 / 3;

const ENDLESS = -1;

export function useSkeletonShimmer(
  onLayout?: (event: LayoutChangeEvent) => void,
) {
  const reduceMotion = useReduceMotion();
  const [blockWidth, setBlockWidth] = useState(0);
  const shimmerWidth = blockWidth * SHIMMER_WIDTH_RATIO;
  const offset = useSharedValue(0);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  useEffect(() => {
    if (reduceMotion || blockWidth === 0) {
      return;
    }

    offset.value = -shimmerWidth;
    offset.value = withRepeat(
      withTiming(blockWidth, {
        duration: SHIMMER_INTERVAL_MS,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      ENDLESS,
      false,
      undefined,
      ReduceMotion.Never,
    );

    return () => cancelAnimation(offset);
  }, [reduceMotion, blockWidth, shimmerWidth, offset]);

  const measure = (event: LayoutChangeEvent) => {
    setBlockWidth(event.nativeEvent.layout.width);
    onLayout?.(event);
  };

  return {
    showShimmer: !reduceMotion,
    onLayout: measure,
    shimmerStyle,
    shimmerWidth,
  };
}
