import { styled } from "nativewind";
import {
  Circle as SvgCircle,
  Polygon as SvgPolygon,
  Polyline as SvgPolyline,
  Rect as SvgRect,
} from "react-native-svg";

const PAINT_MAPPING = {
  className: {
    target: false,
    nativeStyleMapping: { fill: "fill", stroke: "stroke" },
  },
} as const;

export const Circle = styled(SvgCircle, PAINT_MAPPING);

export const Polygon = styled(SvgPolygon, PAINT_MAPPING);

export const Polyline = styled(SvgPolyline, PAINT_MAPPING);

export const Rect = styled(SvgRect, PAINT_MAPPING);
