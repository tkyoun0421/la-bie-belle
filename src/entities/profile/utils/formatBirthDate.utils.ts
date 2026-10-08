const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type CalendarDay = { year: number; month: number; day: number };

function kstCalendarDay(instant: string): CalendarDay {
  const shifted = new Date(Date.parse(instant) + KST_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function parseIsoDate(isoDate: string): CalendarDay {
  const [year, month, day] = isoDate.split("-").map(Number);

  return { year, month, day };
}

function yearsBetween(birth: CalendarDay, today: CalendarDay): number {
  const passed =
    today.month > birth.month ||
    (today.month === birth.month && today.day >= birth.day);

  return today.year - birth.year - (passed ? 0 : 1);
}

export function formatBirthDate(birthDate: string, today: string): string {
  const birth = parseIsoDate(birthDate);
  const age = yearsBetween(birth, kstCalendarDay(today));

  return `${birth.year}년 ${birth.month}월 ${birth.day}일(${age}세)`;
}
