import { kstDateOf } from "@/shared/utils/kstDate";

export function spellLeftAt(leftAt: string): string {
  const [year, month, day] = kstDateOf(leftAt).split("-").map(Number);

  return `${year}년 ${month}월 ${day}일`;
}
