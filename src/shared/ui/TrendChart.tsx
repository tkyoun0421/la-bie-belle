import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg from "react-native-svg";
import { Circle, Polygon, Polyline } from "@/shared/ui/SvgPaint";
import { Text } from "@/shared/ui/Text";

/**
 * 가로축이 달이고 세로축이 값인 열두 달 추이다. 정본은
 * `docs/2-design/design-system/components.md`의 「추이 그래프」다.
 *
 * **그림이 숫자를 대신하지 않는다.** 그림은 크기를 견주는 일만 맡고 정확한 값은 눈금이
 * 아니라 글자에서 읽는다. 그래서 축 선도 격자도 없다 — 가로축 글자와 값 글자가 이미 있어서
 * 선을 더 그으면 그림보다 선이 많아진다.
 *
 * **점이 보는 달에만 선다.** 열두 점을 다 찍으면 선보다 점이 눈에 먼저 들어온다. 달 줄에서
 * 고른 달이 어디인지가 이 점 하나로 말해진다.
 *
 * **가로축 글자를 다 안 쓴다.** 폰 가로에 열두 개가 겹쳐서 1·4·7·10월만 적고 나머지는
 * 눈금만 남는다.
 *
 * **값이 없는 달은 선이 끊긴다.** 앱을 쓰기 전 달은 0이 아니라 없는 것이라, 0으로 이으면 그
 * 달에 일을 안 한 것처럼 읽힌다.
 *
 * 선과 면은 SVG 도형이라 색이 `fill`·`stroke`로 간다. `SvgPaint`가 `fill-*`·`stroke-*`
 * 유틸을 그 두 prop으로 옮긴다.
 */

const CHART_HEIGHT = 96;

const DOT_RADIUS = 3;

const DOT_BORDER_WIDTH = 2;

/** 양 끝 달의 점이 위아래로 잘리지 않을 만큼만 안으로 들인다. */
const PLOT_INSET = DOT_RADIUS + DOT_BORDER_WIDTH;

const LINE_WIDTH = 2;

const TICK_WIDTH = 1;

const TICK_HEIGHT = 4;

/** 값 글자가 점 위로 이만큼 떠 있는다. */
const VALUE_LABEL_GAP = 8;

const LABELLED_MONTHS = new Set([1, 4, 7, 10]);

export type TrendChartPoint = {
  month: number;
  value: number | null;
};

export type TrendChartProps = {
  points: TrendChartPoint[];
  selectedMonth: number;
  valueLabel?: string;
  testID?: string;
};

type PlotPoint = {
  index: number;
  x: number;
  y: number;
};

export function TrendChart({
  points,
  selectedMonth,
  valueLabel,
  testID,
}: TrendChartProps) {
  const [width, setWidth] = useState(0);

  const measure = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const plotted = plot(points, width);
  const segments = segmentsOf(plotted);
  const selected = plotted.find(
    (point) => points[point.index].month === selectedMonth,
  );

  return (
    <View testID={testID}>
      <View onLayout={measure} style={{ height: CHART_HEIGHT }}>
        {width === 0 ? null : (
          <Svg width={width} height={CHART_HEIGHT}>
            {segments.map((segment) => (
              <Polygon
                key={`area-${segment[0].index}`}
                points={areaPointsOf(segment)}
                className="fill-bg-brand-weak"
              />
            ))}
            {segments.map((segment) => (
              <Polyline
                key={`line-${segment[0].index}`}
                points={linePointsOf(segment)}
                className="fill-none stroke-stroke-brand-solid"
                strokeWidth={LINE_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {selected === undefined ? null : (
              <Circle
                cx={selected.x}
                cy={selected.y}
                r={DOT_RADIUS}
                className="fill-bg-brand-solid stroke-bg-neutral"
                strokeWidth={DOT_BORDER_WIDTH}
              />
            )}
          </Svg>
        )}

        {selected === undefined || valueLabel === undefined ? null : (
          <View
            className="absolute inset-x-0 flex-row"
            style={{
              bottom: CHART_HEIGHT - selected.y + VALUE_LABEL_GAP,
              pointerEvents: "none",
            }}
          >
            {points.map((point, index) => (
              <View key={point.month} className="flex-1 items-center">
                {index === selected.index ? (
                  <Text className="font-medium text-xs text-fg-neutral tabular-nums">
                    {valueLabel}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="mt-2 flex-row items-center">
        {points.map((point) => (
          <View key={point.month} className="flex-1 items-center">
            {LABELLED_MONTHS.has(point.month) ? (
              <Text className="text-xs text-fg-neutral-subtle tabular-nums">
                {point.month}월
              </Text>
            ) : (
              <View
                className="bg-bg-neutral-weak"
                style={{ width: TICK_WIDTH, height: TICK_HEIGHT }}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * 달마다 한 칸을 주고 칸 가운데에 점을 세운다. 가로축 글자가 같은 칸 나눔을 쓰므로 점과
 * 글자가 저절로 맞는다. 값이 하나뿐이거나 전부 같으면 세로 가운데에 눕힌다 — 나눌 폭이
 * 없는데 위나 아래에 붙이면 없는 증감을 말하게 된다.
 */
function plot(points: TrendChartPoint[], width: number): PlotPoint[] {
  const values = points
    .map((point) => point.value)
    .filter((value): value is number => value !== null);

  if (width === 0 || values.length === 0) {
    return [];
  }

  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const span = highest - lowest;
  const top = PLOT_INSET;
  const bottom = CHART_HEIGHT - PLOT_INSET;
  const column = width / points.length;

  return points.flatMap((point, index) =>
    point.value === null
      ? []
      : [
          {
            index,
            x: (index + 0.5) * column,
            y:
              span === 0
                ? (top + bottom) / 2
                : bottom - ((point.value - lowest) / span) * (bottom - top),
          },
        ],
  );
}

/** 값이 없는 달에서 끊어진 토막들이다. 혼자 남은 점은 이을 상대가 없어 빠진다. */
function segmentsOf(plotted: PlotPoint[]): PlotPoint[][] {
  const segments: PlotPoint[][] = [];
  let current: PlotPoint[] = [];

  for (const point of plotted) {
    const previous = current[current.length - 1];

    if (previous !== undefined && previous.index + 1 !== point.index) {
      segments.push(current);
      current = [];
    }

    current.push(point);
  }

  segments.push(current);

  return segments.filter((segment) => segment.length > 1);
}

function linePointsOf(segment: PlotPoint[]): string {
  return segment.map((point) => `${point.x},${point.y}`).join(" ");
}

function areaPointsOf(segment: PlotPoint[]): string {
  const first = segment[0];
  const last = segment[segment.length - 1];

  return `${linePointsOf(segment)} ${last.x},${CHART_HEIGHT} ${first.x},${CHART_HEIGHT}`;
}
