import { useEffect, useState } from "react";
import {
  REDUCE_MOTION_SOURCE,
  type ReduceMotionSource,
} from "@/shared/lib/reduceMotion.lib";

export function useReduceMotion(
  source: ReduceMotionSource = REDUCE_MOTION_SOURCE,
): boolean {
  const [reduceMotion, setReduceMotion] = useState(
    () => source.lastKnownReduceMotion?.() ?? true,
  );

  useEffect(() => {
    let mounted = true;
    let heardChange = false;

    const subscription = source.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        heardChange = true;
        setReduceMotion(enabled);
      },
    );

    source.isReduceMotionEnabled().then(
      (enabled) => {
        if (mounted && !heardChange) {
          setReduceMotion(enabled);
        }
      },
      () => {
        if (mounted && !heardChange) {
          setReduceMotion(true);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [source]);

  return reduceMotion;
}
