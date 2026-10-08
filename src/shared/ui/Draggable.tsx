import { useMemo, type ReactNode } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useDrag } from "@/shared/stores/drag.context";
import { cn } from "@/shared/utils/cn";

const LIFT_DELAY_MS = 300;

const LIFT_DURATION_MS = 125;

const LIFT_SCALE = 1.03;

export type DraggableProps = {
  id: string;
  disabled?: boolean;
  children: ReactNode;
};

export function Draggable({ id, disabled = false, children }: DraggableProps) {
  const { draggingId, begin, move, finish } = useDrag();
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const scale = useSharedValue(1);

  const lifted = draggingId === id;

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .activateAfterLongPress(LIFT_DELAY_MS)
        .onStart(() => {
          scale.value = withTiming(LIFT_SCALE, {
            duration: LIFT_DURATION_MS,
          });
          runOnJS(begin)(id);
        })
        .onUpdate((event) => {
          offsetX.value = event.translationX;
          offsetY.value = event.translationY;
          runOnJS(move)(event.absoluteX, event.absoluteY);
        })
        .onFinalize(() => {
          offsetX.value = 0;
          offsetY.value = 0;
          scale.value = withTiming(1, { duration: LIFT_DURATION_MS });
          runOnJS(finish)();
        }),
    [begin, disabled, finish, id, move, offsetX, offsetY, scale],
  );

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View>
      {lifted ? (
        <View className="absolute inset-0 rounded-lg border border-dashed border-stroke-neutral-muted" />
      ) : null}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={style}
          className={cn(
            lifted && "z-10 rounded-lg border border-stroke-neutral-muted",
          )}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
