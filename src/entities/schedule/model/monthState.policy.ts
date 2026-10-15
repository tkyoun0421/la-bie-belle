export type MonthState =
  "not_created" | "collecting" | "closed_awaiting_confirmation" | "confirmed";

export type MonthStateInput = {
  schedule: {
    applicationDeadline: string | null;
    confirmedAt: string | null;
  } | null;
  today: string;
};

export function monthState({ schedule, today }: MonthStateInput): MonthState {
  if (schedule === null) {
    return "not_created";
  }

  if (schedule.confirmedAt !== null) {
    return "confirmed";
  }

  if (
    schedule.applicationDeadline !== null &&
    schedule.applicationDeadline >= today
  ) {
    return "collecting";
  }

  return "closed_awaiting_confirmation";
}
