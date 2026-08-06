export type RehearsalEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  amount: number;
};

export const MOCK_REHEARSAL_HOURLY_RATE = 15000;

export function calculateRehearsalHours(startTime: string, endTime: string): number {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return Number.isFinite(minutes) && minutes > 0 ? minutes / 60 : 0;
}

export function calculateRehearsalAmount(
  startTime: string,
  endTime: string,
  hourlyRate: number,
): number {
  return Math.round(calculateRehearsalHours(startTime, endTime) * hourlyRate);
}
