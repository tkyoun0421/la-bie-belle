import type { Holiday } from "@/features/holiday/model/holiday.schema";

export type HolidayImportEntry = {
  holiday_date: string;
  name: string;
};

export function toHolidayImportEntry(holiday: Holiday): HolidayImportEntry {
  return { holiday_date: holiday.date, name: holiday.name };
}
