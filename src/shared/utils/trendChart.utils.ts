import { CHART_HEIGHT, PLOT_INSET } from "@/shared/consts/trendChart.const";

export type TrendChartPoint = {
  month: number;
  value: number | null;
};

export type PlotPoint = {
  index: number;
  x: number;
  y: number;
};

export function plot(
  points: readonly TrendChartPoint[],
  width: number,
): PlotPoint[] {
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

export function segmentsOf(plotted: readonly PlotPoint[]): PlotPoint[][] {
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

export function linePointsOf(segment: readonly PlotPoint[]): string {
  return segment.map((point) => `${point.x},${point.y}`).join(" ");
}

export function areaPointsOf(segment: readonly PlotPoint[]): string {
  const first = segment[0];
  const last = segment[segment.length - 1];

  return `${linePointsOf(segment)} ${last.x},${CHART_HEIGHT} ${first.x},${CHART_HEIGHT}`;
}
