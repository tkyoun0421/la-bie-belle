import type { HolidayApiEntry } from "@/features/holiday/model/holiday.schema";

export type HolidayImportEntry = {
  holiday_date: string;
  name: string;
};

export function toHolidayImportEntry(
  holiday: HolidayApiEntry,
): HolidayImportEntry {
  return { holiday_date: holiday.date, name: holiday.name };
}
