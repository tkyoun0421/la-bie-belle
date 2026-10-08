import { kstDateOf } from "@/shared/utils/kstDate";

export function kstToday(now: Date = new Date()): string {
  return kstDateOf(now);
}
