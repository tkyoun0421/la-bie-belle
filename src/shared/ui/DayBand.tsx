import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg from "react-native-svg";
import {
  dayBandCheckInMarkRatio,
  dayBandFillRatio,
  type ShiftWindow,
} from "@/shared/lib/day-band";
import { Rect } from "@/shared/ui/SvgPaint";
import { Text } from "@/shared/ui/Text";

/**
 * 그날의 근무를 가로축 하나로 눕히고 지금까지 얼마나 지났는지를 채운다. 정본은
 * `docs/2-design/design-system/components.md`의 「하루 띠」와
 * `docs/2-design/system/screens/dashboard.md`의 「하루 띠」다.
 *
 * **축이 근무다. 하루가 아니다.** 왼쪽 끝이 출근 시각이고 오른쪽 끝이 퇴근 시각이라 4시간
 * 근무와 9시간 근무가 화면에서 같은 폭으로 선다. 비율은 `@/shared/lib/day-band`가 내고 이
 * 조각은 받은 수를 폭으로 옮기기만 한다.
 *
 * **글자는 네 귀퉁이에 붙고 트랙 안에는 아무것도 안 들어간다.** 안에 넣으면 채움이 짧을 때
 * 글자가 트랙 밖으로 삐져나오거나 채움 색 위에 얹혀 대비가 자리마다 달라진다. 무슨 말을
 * 적을지는 화면이 정한다 — 이 조각은 받은 문구를 그 자리에 세운다.
 *
 * **지금 선이 없다.** 채움의 오른쪽 끝이 곧 지금이다. 선을 따로 그으면 같은 사실을 두 번
 * 말하고, 그 선에 붙는 라벨이 양끝 시각과 부딪힌다.
 *
 * **확정 전에는 점선 트랙만 선다.** 근무 시각을 모르면 축의 양끝이 없고, 양끝이 없으면
 * 퍼센트도 없다. 네 귀퉁이가 통째로 사라지는 것은 빈 글자 자리를 남기면 무언가 안 그려진
 * 것으로 읽히기 때문이다.
 *
 * **근무가 없는 날은 띠가 통째로 없다.** 축이 근무라서 근무가 없으면 축도 없다. 빈 트랙을
 * 남기면 0퍼센트짜리 근무가 있는 것으로 읽힌다.
 */

const TRACK_HEIGHT = 8;

/** `rounded-full`을 SVG 좌표로 옮긴 값이다 — 트랙 높이의 절반이다. */
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

/**
 * 확정 전 트랙이다. 면이 없고 점선만 남아 「여기 곧 뭔가 선다」는 자리 표시로 서고, 말은 띠
 * 아래 한 줄이 맡는다. 폭이 화면에서 정해져 이쪽이 먼저 알 수 없으니 한 번 재고 나서
 * 그린다.
 */
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
