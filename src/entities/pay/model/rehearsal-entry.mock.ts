import {
  calculateRehearsalAmount,
  MOCK_REHEARSAL_HOURLY_RATE,
  type RehearsalEntry,
} from "@/entities/pay/model/rehearsal-entry";

function entry(id: string, date: string, startTime: string, endTime: string): RehearsalEntry {
  return {
    id,
    date,
    startTime,
    endTime,
    hourlyRate: MOCK_REHEARSAL_HOURLY_RATE,
    amount: calculateRehearsalAmount(startTime, endTime, MOCK_REHEARSAL_HOURLY_RATE),
  };
}

export const REHEARSAL_ENTRIES: RehearsalEntry[] = [
  entry("reh-1", "2026-08-11", "13:00", "15:00"),
  entry("reh-2", "2026-08-18", "10:00", "11:30"),
];

export const HEAVY_REHEARSAL_ENTRIES: RehearsalEntry[] = [
  entry("reh-3", "2026-08-05", "09:00", "13:00"),
  entry("reh-4", "2026-08-20", "14:00", "16:00"),
];
