import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg from "react-native-svg";
import { Rect } from "@/shared/ui/SvgPaint";
import { Text } from "@/shared/ui/Text";
import {
  dayBandCheckInMarkRatio,
  dayBandFillRatio,
  type ShiftWindow,
} from "@/shared/utils/dayBand";

const TRACK_HEIGHT = 8;

const TRACK_RADIUS = TRACK_HEIGHT / 2;

const DASH_STROKE_WIDTH = 1;

const DASH_PATTERN = [3, 3];

export type DayBandProps = {
  shift: ShiftWindow | null;
  now: Date;
  checkInAt?: Date | null;
  isConfirmed?: boolean;
  progressLabel?: string;
  remainingLabel?: string;
  startLabel?: string;
  endLabel?: string;
  testID?: string;
};

export function DayBand({
  shift,
  now,
  checkInAt = null,
  isConfirmed = true,
  progressLabel,
  remainingLabel,
  startLabel,
  endLabel,
  testID,
}: DayBandProps) {
  if (!isConfirmed) {
    return <PendingTrack testID={testID} />;
  }

  if (shift === null) {
    return null;
  }

  const fillRatio = dayBandFillRatio(shift, now, isConfirmed) ?? 0;
  const markRatio = dayBandCheckInMarkRatio(shift, checkInAt);

  return (
    <View testID={testID}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-semibold text-sm text-fg-neutral tabular-nums">
          {progressLabel}
        </Text>
        <Text className="text-xs text-fg-neutral-subtle tabular-nums">
          {remainingLabel}
        </Text>
      </View>

      <View
        className="overflow-hidden rounded-full bg-bg-neutral-weak"
        style={{ height: TRACK_HEIGHT }}
      >
        <View
          testID={testID ? `${testID}-fill` : undefined}
          className="h-full rounded-full bg-bg-brand-solid"
          style={{ width: `${fillRatio}%` }}
        />
        {markRatio === null ? null : (
          <View
            testID={testID ? `${testID}-check-in-mark` : undefined}
            className="absolute top-0 h-full w-0.5 bg-bg-neutral-solid"
            style={{ left: `${markRatio}%` }}
          />
        )}
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-fg-neutral-subtle tabular-nums">
          {startLabel}
        </Text>
        <Text className="text-xs text-fg-neutral-subtle tabular-nums">
          {endLabel}
        </Text>
      </View>
    </View>
  );
}

function PendingTrack({ testID }: { testID?: string }) {
  const [width, setWidth] = useState(0);

  const measure = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View testID={testID} onLayout={measure} style={{ height: TRACK_HEIGHT }}>
      {width === 0 ? null : (
        <Svg width={width} height={TRACK_HEIGHT}>
          <Rect
            x={DASH_STROKE_WIDTH / 2}
            y={DASH_STROKE_WIDTH / 2}
            width={Math.max(0, width - DASH_STROKE_WIDTH)}
            height={TRACK_HEIGHT - DASH_STROKE_WIDTH}
            rx={TRACK_RADIUS}
            className="fill-none stroke-stroke-neutral-muted"
            strokeWidth={DASH_STROKE_WIDTH}
            strokeDasharray={DASH_PATTERN}
          />
        </Svg>
      )}
    </View>
  );
}
