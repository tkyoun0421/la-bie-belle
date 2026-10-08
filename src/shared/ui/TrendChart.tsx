import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg from "react-native-svg";
import { Circle, Polygon, Polyline } from "@/shared/ui/SvgPaint";
import { Text } from "@/shared/ui/Text";

const CHART_HEIGHT = 96;

const DOT_RADIUS = 3;

const DOT_BORDER_WIDTH = 2;

const PLOT_INSET = DOT_RADIUS + DOT_BORDER_WIDTH;

const LINE_WIDTH = 2;

const TICK_WIDTH = 1;

const TICK_HEIGHT = 4;

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
