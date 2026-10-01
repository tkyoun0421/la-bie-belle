import type { RehearsalTotal } from "@/entities/rehearsal/model/rehearsalHours";

/**
 * 달 줄 오른쪽의 합계다 — 「3건 · 5시간」
 * (`docs/2-design/modules/schedule/screens/rehearsal.md`의 「문안」).
 *
 * **0건이면 자리가 빈다.** 「0건」을 안 적는다 — 그 달에 넣은 것이 없다는 말은 빈 달력이
 * 이미 하고 있다.
 *
 * 시간 문구를 이 파일이 소유하는 것은 달력 칸과 날 시트 줄이 같은 꼴을 쓰기 때문이다 —
 * 세 자리가 각자 적으면 「1시간 30분」이 자리마다 달라진다.
 */

const MINUTES_PER_HOUR = 60;

/** 「2시간」·「1시간 30분」·「30분」. 60의 배수가 아니면 분까지 적는다. */
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
