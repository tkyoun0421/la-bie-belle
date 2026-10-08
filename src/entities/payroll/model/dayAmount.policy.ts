import { REGULAR_MINUTES } from "@/entities/payroll/consts/payroll.const";
import type { DayKind } from "@/entities/payroll/model/payroll.type";

export type DayAmount = {
  minutes: number;
  amount: number;
  kind: DayKind;
};

const SCALE = 120;

const REGULAR_WEIGHT = 2;

const OVERTIME_WEIGHT = 3;

export function dayAmount({
  minutes,
  wage,
}: {
  minutes: number;
  wage: number;
}): DayAmount {
  if (minutes <= 0) {
    return { minutes, amount: 0, kind: "absent" };
  }

  const regular = Math.min(minutes, REGULAR_MINUTES);
  const overtime = minutes - regular;
  const weighted = regular * REGULAR_WEIGHT + overtime * OVERTIME_WEIGHT;

  return {
    minutes,
    amount: Math.round((wage * weighted) / SCALE),
    kind: overtime > 0 ? "overtime" : "normal",
  };
}
