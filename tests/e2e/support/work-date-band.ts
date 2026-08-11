export type WorkDateBand = {
  minMonthsAhead: number;
  maxMonthsAhead: number;
};

export const WORK_DATE_BANDS = {
  workerCalendar: { minMonthsAhead: 6, maxMonthsAhead: 17 },
  recruitmentOpen: { minMonthsAhead: 18, maxMonthsAhead: 29 },
  recruitmentDeadline: { minMonthsAhead: 31, maxMonthsAhead: 59 },
  recruitmentImminent: { minMonthsAhead: 61, maxMonthsAhead: 89 },
  ceremonyEditOpen: { minMonthsAhead: 98, maxMonthsAhead: 113 },
  ceremonyEditConfirmed: { minMonthsAhead: 115, maxMonthsAhead: 130 },
  positionRequirements: { minMonthsAhead: 132, maxMonthsAhead: 163 },
  viewTransition: { minMonthsAhead: 165, maxMonthsAhead: 196 },
  motionComputedStyle: { minMonthsAhead: 198, maxMonthsAhead: 229 },
  assignmentEligibility: { minMonthsAhead: 231, maxMonthsAhead: 262 },
  swipeRefresh: { minMonthsAhead: 264, maxMonthsAhead: 295 },
  assignmentTrainee: { minMonthsAhead: 297, maxMonthsAhead: 328 },
} as const satisfies Record<string, WorkDateBand>;

const LAST_SAFE_DAY_OF_MONTH = 27;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function monthAnchorInBand(band: WorkDateBand): { year: number; month: number } {
  const now = new Date();
  const span = band.maxMonthsAhead - band.minMonthsAhead + 1;
  const offset = band.minMonthsAhead + Math.floor(Math.random() * span);
  const monthIndex = now.getMonth() + offset;

  return {
    year: now.getFullYear() + Math.floor(monthIndex / 12),
    month: (monthIndex % 12) + 1,
  };
}

export function workDatesInBand(band: WorkDateBand, count: number): string[] {
  const picked = new Set<string>();

  while (picked.size < count) {
    const { year, month } = monthAnchorInBand(band);
    const day = 1 + Math.floor(Math.random() * LAST_SAFE_DAY_OF_MONTH);
    picked.add(`${year}-${pad(month)}-${pad(day)}`);
  }

  return Array.from(picked);
}

export function workDateInBand(band: WorkDateBand): string {
  return workDatesInBand(band, 1)[0]!;
}
