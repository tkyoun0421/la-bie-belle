export const CEREMONY_COUNT_MIN = 1;
export const CEREMONY_COUNT_MAX = 12;
export const CEREMONY_INTERVAL_MINUTES = 60;
export const CHECKOUT_OFFSET_MINUTES = 120;
export const MINUTES_PER_DAY = 1440;
export const CHECKOUT_CAP_TIME = "23:59";

export type CheckInRule = { firstCeremonyAt: string; recommendedCheckIn: string };
export type CheckOutRecommendation = { time: string; capped: boolean };

function timeToMinutes(time: string): number {
  const [hoursPart, minutesPart] = time.split(":");
  return Number(hoursPart ?? 0) * 60 + Number(minutesPart ?? 0);
}

function minutesToTime(minutes: number): string {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const remainingMinutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

export function normalizeTime(raw: string): string {
  const [hours, minutes] = raw.split(":");
  return `${(hours ?? "").padStart(2, "0")}:${(minutes ?? "").padStart(2, "0")}`;
}

export function isValidCeremonyCount(count: number): boolean {
  return Number.isInteger(count) && count >= CEREMONY_COUNT_MIN && count <= CEREMONY_COUNT_MAX;
}

export function generateCeremonyTimes(count: number, firstCeremonyTime: string): string[] | null {
  const start = timeToMinutes(firstCeremonyTime);
  const lastMinutes = start + (count - 1) * CEREMONY_INTERVAL_MINUTES;
  if (lastMinutes >= MINUTES_PER_DAY) {
    return null;
  }
  return Array.from({ length: count }, (_, index) =>
    minutesToTime(start + index * CEREMONY_INTERVAL_MINUTES),
  );
}

export function sortCeremonyTimes(times: string[]): string[] {
  return [...times].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

export function hasDuplicateCeremonyTime(times: string[]): boolean {
  return new Set(times).size !== times.length;
}

export function recommendCheckIn(rules: CheckInRule[], firstCeremonyTime: string): string | null {
  if (rules.length === 0) {
    return null;
  }

  const sortedRules = [...rules].sort(
    (a, b) => timeToMinutes(a.firstCeremonyAt) - timeToMinutes(b.firstCeremonyAt),
  );
  const targetMinutes = timeToMinutes(firstCeremonyTime);

  let candidate = sortedRules[0] as CheckInRule;
  for (const rule of sortedRules) {
    if (timeToMinutes(rule.firstCeremonyAt) <= targetMinutes) {
      candidate = rule;
    } else {
      break;
    }
  }

  const intervalMinutes =
    timeToMinutes(candidate.firstCeremonyAt) - timeToMinutes(candidate.recommendedCheckIn);
  return minutesToTime(targetMinutes - intervalMinutes);
}

export function recommendCheckOut(lastCeremonyTime: string): CheckOutRecommendation {
  const totalMinutes = timeToMinutes(lastCeremonyTime) + CHECKOUT_OFFSET_MINUTES;
  if (totalMinutes >= MINUTES_PER_DAY) {
    return { time: CHECKOUT_CAP_TIME, capped: true };
  }
  return { time: minutesToTime(totalMinutes), capped: false };
}
