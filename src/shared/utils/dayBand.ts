export type ShiftWindow = {
  start: Date;
  end: Date;
};

const FULL = 100;

function ratioWithin(shift: ShiftWindow, moment: Date): number {
  const span = shift.end.getTime() - shift.start.getTime();
  const elapsed = moment.getTime() - shift.start.getTime();

  return Math.min(FULL, Math.max(0, (elapsed / span) * FULL));
}

export function dayBandFillRatio(
  shift: ShiftWindow,
  now: Date,
  isConfirmed: boolean,
): number | null {
  return isConfirmed ? ratioWithin(shift, now) : null;
}

export function dayBandCheckInMarkRatio(
  shift: ShiftWindow,
  checkInAt: Date | null,
): number | null {
  return checkInAt === null ? null : ratioWithin(shift, checkInAt);
}
