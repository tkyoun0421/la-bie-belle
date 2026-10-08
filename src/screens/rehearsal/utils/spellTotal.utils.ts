import type { RehearsalTotal } from "@/entities/rehearsal/model/rehearsal.type";

const MINUTES_PER_HOUR = 60;

export function spellMinutes(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (hours === 0) {
    return `${rest}분`;
  }

  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

export function spellTotal({ count, minutes }: RehearsalTotal): string {
  return count === 0 ? "" : `${count}건 · ${spellMinutes(minutes)}`;
}
