import { Check, User } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Svg from "react-native-svg";
import { Icon } from "@/shared/ui/Icon";
import { Rect } from "@/shared/ui/SvgPaint";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const TODAY_CIRCLE_SIZE = 21;

const ASSIGNED_DOT_SIZE = 4;

const MARK_ICON_SIZE = 12;

const VACANCY_RING_SIZE = 10;

const DASH_STROKE_WIDTH = 1;

const DASH_PATTERN = [3, 3];

const CELL_RADIUS = 8;

export type ScheduleDayCellState =
  | "assigned"
  | "requested"
  | "open"
  | "muted"
  | "plain"
  | "closed"
  | "unconfirmed"
  | "picked"
  | "admin-open"
  | "admin-picked";

type CellLook = {
  surface?: string;
  day: string;
  border?: string;
  outline?: string;
};

const LOOKS: Record<ScheduleDayCellState, CellLook> = {
  assigned: { surface: "bg-bg-brand-weak", day: "text-fg-neutral" },
  requested: {
    surface: "bg-bg-neutral-weak",
    day: "text-fg-neutral-muted",
    outline: "stroke-stroke-brand-solid",
  },
  open: { surface: "bg-bg-neutral-weak", day: "text-fg-neutral-muted" },
  muted: { day: "text-fg-neutral-muted" },
  plain: { day: "text-fg-neutral" },
  closed: { day: "text-fg-neutral-subtle" },
  unconfirmed: {
    day: "text-fg-neutral-subtle",
    outline: "stroke-stroke-neutral-muted",
  },
  picked: {
    surface: "bg-bg-brand-weak-selected",
    day: "text-fg-neutral",
    border: "border border-stroke-brand-solid",
  },
  "admin-open": { surface: "bg-bg-neutral-weak", day: "text-fg-neutral" },
  "admin-picked": {
    surface: "bg-bg-brand-weak-selected",
    day: "text-fg-neutral",
    border: "border border-stroke-brand-solid",
  },
};

const CHECKED = new Set<ScheduleDayCellState>(["picked", "admin-picked"]);

export type ScheduleDayCellProps = {
  day: number | null;
  state: ScheduleDayCellState;
  isToday?: boolean;
  applicationCount?: number;
  vacancyCount?: number | null;
  note?: string | null;
  onPress?: () => void;
  testID?: string;
};

export function ScheduleDayCell({
  day,
  state,
  isToday = false,
  applicationCount = 0,
  vacancyCount = null,
  note = null,
  onPress,
  testID,
}: ScheduleDayCellProps) {
  const look = LOOKS[state];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={onPress === undefined || day === null}
      onPress={onPress}
      className={cn(
        "h-16 items-center rounded-sm pt-1.5 pb-1",
        look.surface,
        look.border,
      )}
    >
      {look.outline === undefined ? null : (
        <DashedOutline className={look.outline} radius={CELL_RADIUS} />
      )}
      {day === null ? null : (
        <>
          <DayNumber day={day} isToday={isToday} className={look.day} />
          <View className="flex-1 justify-end">
            <CellMark
              state={state}
              applicationCount={applicationCount}
              vacancyCount={vacancyCount}
              note={note}
              testID={testID}
            />
          </View>
        </>
      )}
    </Pressable>
  );
}

function DayNumber({
  day,
  isToday,
  className,
}: {
  day: number;
  isToday: boolean;
  className: string;
}) {
  if (!isToday) {
    return <Text className={cn("text-xs tabular-nums", className)}>{day}</Text>;
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-bg-neutral-solid"
      style={{ width: TODAY_CIRCLE_SIZE, height: TODAY_CIRCLE_SIZE }}
    >
      <Text className="text-xs text-fg-neutral-contrast tabular-nums">
        {day}
      </Text>
    </View>
  );
}

function CellMark({
  state,
  applicationCount,
  vacancyCount,
  note,
  testID,
}: {
  state: ScheduleDayCellState;
  applicationCount: number;
  vacancyCount: number | null;
  note: string | null;
  testID?: string;
}) {
  if (note) {
    return (
      <Text className="text-xs text-fg-neutral-subtle tabular-nums">
        {note}
      </Text>
    );
  }

  if (CHECKED.has(state)) {
    return (
      <Icon
        icon={Check}
        size={MARK_ICON_SIZE}
        testID={testID ? `${testID}-selected` : undefined}
        className="text-fg-brand"
      />
    );
  }

  if (state === "assigned") {
    return (
      <View
        className="rounded-full bg-bg-brand-solid"
        style={{ width: ASSIGNED_DOT_SIZE, height: ASSIGNED_DOT_SIZE }}
      />
    );
  }

  if (state === "admin-open" && vacancyCount !== null) {
    return vacancyCount === 0 ? null : (
      <View className="flex-row items-center gap-0.5">
        <View
          className="rounded-full border border-dashed border-stroke-neutral-muted"
          style={{ width: VACANCY_RING_SIZE, height: VACANCY_RING_SIZE }}
        />
        <Text className="text-xs text-fg-neutral-subtle tabular-nums">
          {vacancyCount}
        </Text>
      </View>
    );
  }

  if (state === "admin-open" && applicationCount > 0) {
    return (
      <View className="flex-row items-center gap-0.5">
        <Icon
          icon={User}
          size={MARK_ICON_SIZE}
          className="text-fg-neutral-subtle"
        />
        <Text className="text-xs text-fg-neutral-subtle tabular-nums">
          {applicationCount}
        </Text>
      </View>
    );
  }

  return null;
}

function DashedOutline({
  className,
  radius,
}: {
  className: string;
  radius: number;
}) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(
    null,
  );

  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setBox({ width, height });
  };

  return (
    <View
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
      onLayout={measure}
    >
      {box === null ? null : (
        <Svg width={box.width} height={box.height}>
          <Rect
            x={DASH_STROKE_WIDTH / 2}
            y={DASH_STROKE_WIDTH / 2}
            width={Math.max(0, box.width - DASH_STROKE_WIDTH)}
            height={Math.max(0, box.height - DASH_STROKE_WIDTH)}
            rx={radius}
            className={cn("fill-none", className)}
            strokeWidth={DASH_STROKE_WIDTH}
            strokeDasharray={DASH_PATTERN}
          />
        </Svg>
      )}
    </View>
  );
}
