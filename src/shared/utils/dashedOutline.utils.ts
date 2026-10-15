import { DASH_STROKE_WIDTH } from "@/shared/consts/dashedOutline.const";

type Box = {
  width: number;
  height: number;
};

export function dashedRectOf({ width, height }: Box) {
  return {
    x: DASH_STROKE_WIDTH / 2,
    y: DASH_STROKE_WIDTH / 2,
    width: Math.max(0, width - DASH_STROKE_WIDTH),
    height: Math.max(0, height - DASH_STROKE_WIDTH),
  };
}
