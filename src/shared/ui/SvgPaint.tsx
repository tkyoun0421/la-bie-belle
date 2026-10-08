import { styled } from "nativewind";
import type { ComponentType } from "react";
import {
  Circle as SvgCircle,
  Polygon as SvgPolygon,
  Polyline as SvgPolyline,
  Rect as SvgRect,
  type CircleProps,
  type PolygonProps,
  type PolylineProps,
  type RectProps,
} from "react-native-svg";

const PAINT_MAPPING = {
  className: {
    target: false,
    nativeStyleMapping: { fill: "fill", stroke: "stroke" },
  },
} as const;

type Painted<Props> = ComponentType<Props & { className?: string }>;

export const Circle = styled(SvgCircle, PAINT_MAPPING) as Painted<CircleProps>;

export const Polygon = styled(
  SvgPolygon,
  PAINT_MAPPING,
) as Painted<PolygonProps>;

export const Polyline = styled(
  SvgPolyline,
  PAINT_MAPPING,
) as Painted<PolylineProps>;

export const Rect = styled(SvgRect, PAINT_MAPPING) as Painted<RectProps>;
