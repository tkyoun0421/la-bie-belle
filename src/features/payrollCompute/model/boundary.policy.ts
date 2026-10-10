import {
  anchorOfDate,
  periodAnchor,
  type Period,
} from "@/features/payrollCompute/model/period.policy";

export type ForwardBound = {
  today: string;
  leftAt: string | null;
};

export function canGoToPreviousPeriod(
  period: Period,
  approvedAt: string,
): boolean {
  return periodAnchor(period) > anchorOfDate(approvedAt, period.unit);
}

export function canGoToNextPeriod(
  period: Period,
  { today, leftAt }: ForwardBound,
): boolean {
  return periodAnchor(period) < anchorOfDate(leftAt ?? today, period.unit);
}
