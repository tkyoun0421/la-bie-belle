import { kstDateOf } from "@/shared/utils/kstDate";

/**
 * 오늘이다. 기기 시간대와 무관하게 홀의 하루로 읽는다.
 *
 * `utils`가 아니라 `lib`에 사는 이유는 인자를 안 주면 제가 `new Date()`를 불러 바깥을
 * 읽기 때문이다 — 날짜를 받아 가르는 순수한 손은 `shared/utils/kstDate.ts`에 남는다.
 */
export function kstToday(now: Date = new Date()): string {
  return kstDateOf(now);
}
