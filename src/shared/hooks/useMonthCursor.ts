import { useCallback, useState } from "react";
import { shiftMonth } from "@/shared/utils/kstDate";

export type MonthCursor = {
  month: string;
  goPrev: () => void;
  goNext: () => void;
  jumpTo: (month: string) => void;
};

export function useMonthCursor(
  initial: string,
  onMove?: () => void,
): MonthCursor {
  const [month, setMonth] = useState(initial);

  const move = useCallback(
    (step: number) => {
      setMonth((standing) => shiftMonth(standing, step));
      onMove?.();
    },
    [onMove],
  );

  const goPrev = useCallback(() => move(-1), [move]);
  const goNext = useCallback(() => move(1), [move]);
  const jumpTo = useCallback((asked: string) => setMonth(asked), []);

  return { month, goPrev, goNext, jumpTo };
}
