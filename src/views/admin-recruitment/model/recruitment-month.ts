import { startOfMonth } from "date-fns";

const MONTH_PARAM_PATTERN = /^\d{4}-\d{2}$/;

export function parseRecruitmentMonthParam(value: string | undefined, today: string): Date {
  if (value !== undefined && MONTH_PARAM_PATTERN.test(value)) {
    const parsed = new Date(`${value}-01T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return startOfMonth(parsed);
    }
  }
  return startOfMonth(new Date(`${today}T00:00:00`));
}
