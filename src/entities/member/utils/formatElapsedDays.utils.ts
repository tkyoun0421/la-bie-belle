import { DAY_MS } from "@/shared/consts/time.const";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstDayIndex(instant: string): number {
  return Math.floor((Date.parse(instant) + KST_OFFSET_MS) / DAY_MS);
}

export function formatElapsedDays(submittedAt: string, now: string): string {
  const days = kstDayIndex(now) - kstDayIndex(submittedAt);

  if (days <= 0) {
    return "오늘";
  }

  if (days === 1) {
    return "어제";
  }

  return `${days}일 전`;
}
