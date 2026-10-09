import { kstDateOf } from "@/entities/schedule/utils/formatScheduleDate.utils";

export type ConfirmAffordance = "locked" | "open" | "ended";

export type ConfirmAffordanceInput = {
  applicationDeadline: string | null;
  confirmedAt: string | null;
  now: string;
};

export function confirmAffordance({
  applicationDeadline,
  confirmedAt,
  now,
}: ConfirmAffordanceInput): ConfirmAffordance {
  if (confirmedAt !== null) {
    return "ended";
  }

  if (applicationDeadline === null) {
    return "locked";
  }

  return kstDateOf(now) > applicationDeadline ? "open" : "locked";
}

export function confirmUnlockLine(applicationDeadline: string): string {
  const unlocksAt = new Date(`${applicationDeadline}T00:00:00Z`);

  unlocksAt.setUTCDate(unlocksAt.getUTCDate() + 1);

  return `${unlocksAt.getUTCMonth() + 1}월 ${unlocksAt.getUTCDate()}일부터 확정할 수 있어요`;
}
