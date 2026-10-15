import {
  RISE_DISTANCE,
  RISE_DURATION_MS,
  RISE_STAGGER_MS,
} from "@/shared/consts/motion.const";

export type RiseTiming = {
  delayMs: number;
  durationMs: number;
  distance: number;
};

export function riseTimingOf(index: number, reduceMotion: boolean): RiseTiming {
  return {
    delayMs: index * RISE_STAGGER_MS,
    durationMs: RISE_DURATION_MS,
    distance: reduceMotion ? 0 : RISE_DISTANCE,
  };
}
