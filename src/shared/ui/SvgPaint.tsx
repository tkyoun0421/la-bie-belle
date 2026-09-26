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

/**
 * SVG 도형을 className으로 칠하는 자리다. `Icon`이 lucide에 하는 일을 도형에 한다.
 *
 * 색을 `fill="var(--color-…)"`처럼 문자열로 넘기면 안 된다. 그 문자열을 Tailwind가 소스에서
 * 보고 `--color-*`를 `:root`에 실제 변수로 내놓는데, 그러면 네이티브 컴파일러가 색 유틸을
 * 팔레트 변수 참조가 아니라 라이트 값 하나로 눌러버린다 — 다크에서 색이 안 바뀐다.
 * `tests/lint/native-compile-values.test.ts`가 그 눌림을 잡는다.
 *
 * 그래서 색은 `fill-*`·`stroke-*` 유틸로 적고, 계산된 두 값을 `styled`가 도형의 같은 이름
 * prop으로 옮긴다. 칠하지 않는 쪽은 `fill-none`을 적는다 — 유틸을 안 적으면 그 prop이 빈 채
 * 넘어간다.
 */

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
