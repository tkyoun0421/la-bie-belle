import { kstClockOf, kstDateOf, spellDate } from "@/shared/utils/kstDate";

export function formatSentAt(submittedAt: string): string {
  return `${spellDate(kstDateOf(submittedAt))} ${kstClockOf(submittedAt)}에 보냈어요`;
}
