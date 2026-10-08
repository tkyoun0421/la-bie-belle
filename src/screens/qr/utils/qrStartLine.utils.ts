import { kstDateOf } from "@/shared/utils/kstDate";

export function qrStartLine(rotatedAt: string): string {
  const [year, month, day] = kstDateOf(rotatedAt).split("-").map(Number);

  return `${year}년 ${month}월 ${day}일부터 쓰고 있어요`;
}
