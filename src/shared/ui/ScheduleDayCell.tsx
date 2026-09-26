import { Check, User } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Svg from "react-native-svg";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Rect } from "@/shared/ui/SvgPaint";
import { Text } from "@/shared/ui/Text";

/**
 * 근무표 달력의 날짜 칸 하나다. 정본은
 * `docs/2-design/design-system/components.md`의 「근무표 날짜 칸」이고, 관리자 편집 상태는
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「달력 칸」이 더한 것이다.
 *
 * **달력 한 장에서 쓰는 색은 브랜드와 뉴트럴 둘뿐이다.** 상태가 여덟인데 색이 둘인 것은,
 * 상태마다 색을 붙이면 달력이 색 지도가 되고 정작 내 근무가 어디인지 안 보이기 때문이다.
 *
 * **오늘은 상태와 나란히 서지 않고 그 위에 얹힌다.** 칸 배경은 그날 상태를 그대로 두고
 * 날짜 숫자만 지름 21px 검은 원이 감싼다. 오늘이면서 근무가 있는 날은 브랜드 면에 검은
 * 원과 브랜드 점이 같이 선다 — 상태 둘이 서로를 지우지 않는다.
 *
 * **그리드가 이 달 밖으로 남긴 칸은 비운다.** `day`가 `null`이면 자리만 지키고 숫자도 안
 * 쓴다. 흐린 숫자라도 남기면 그 달 근무표에 든 날로 읽히고, 누르면 어디로 가는지를 또
 * 정해야 한다.
 *
 * 점선을 `border`가 아니라 SVG의 `stroke-dasharray`로 그리는 것은 `border`가 애니메이션을
 * 못 받고, 확정 전 칸의 점선 `border`와 한 칸에서 부딪히기 때문이다. 요청 온 날의 점선이
 * 시계 방향으로 도는 것은 아직 안 붙었다.
 */

const TODAY_CIRCLE_SIZE = 21;

const ASSIGNED_DOT_SIZE = 4;

const MARK_ICON_SIZE = 12;

const DASH_STROKE_WIDTH = 1;

/** 대시와 간격이 각각 3px다. */
const DASH_PATTERN = [3, 3];

/** `rounded-sm`의 8px과 같은 값이다 — SVG는 className이 안 닿아 숫자로 받는다. */
const CELL_RADIUS = 8;

export type ScheduleDayCellState =
  | "assigned"
  | "requested"
  | "open"
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
  onPress?: () => void;
  testID?: string;
};

export function ScheduleDayCell({
  day,
  state,
  isToday = false,
  applicationCount = 0,
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
            <CellMark state={state} applicationCount={applicationCount} />
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
}: {
  state: ScheduleDayCellState;
  applicationCount: number;
}) {
  if (CHECKED.has(state)) {
    return (
      <Icon icon={Check} size={MARK_ICON_SIZE} className="text-fg-brand" />
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

/**
 * 부모 상자를 꽉 채우는 점선 테두리다. 칸 폭이 그리드에서 정해져 이쪽이 먼저 알 수 없으니
 * 한 번 재고 나서 그린다.
 */
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
