import type { RehearsalTotal } from "@/entities/rehearsal/model/rehearsal.type";

/**
 * 리허설을 시간으로 환산한다. **1건이 1시간이다**
 * (`docs/2-design/modules/schedule/README.md`의 SCH-023) — 건수로 넣은 것과 시각으로 넣은
 * 것이 한 달력에 같이 서는데, 급여가 갈래와 무관하게 시간만 쓰므로
 * (`docs/2-design/modules/payroll/README.md`의 PAY-028) 화면도 시간을 최종 단위로 삼는다.
 *
 * **표에 시간 열이 없다.** 건수에서 시간을 내는 것은 저장이 아니라 계산이라 여기 하나에만
 * 산다 — 달력 칸도 달 줄 합계도 날 시트도 같은 함수를 부른다.
 *
 * 합계의 「건수」는 행마다 하나가 아니다. 건수 갈래 줄은 제 `count`만큼, 시각 갈래 줄은 한
 * 건으로 센다 — 「3건 · 5시간」의 3이 줄 수가 아니라 리허설 횟수다.
 */

const MINUTES_PER_COUNT = 60;

const MINUTES_PER_HOUR = 60;

export type RehearsalRow = {
  starts_at: string | null;
  ends_at: string | null;
  count: number | null;
};

/** `"14:00"`도 `"14:00:00"`도 같은 분이다 — DB는 초까지 싣고 화면은 안 싣는다. */
function minutesOfClock(clock: string): number {
  const [hour, minute] = clock.split(":").map(Number);

  return hour * MINUTES_PER_HOUR + minute;
}

export function rehearsalHours(row: RehearsalRow): number {
  if (row.count !== null) {
    return row.count * MINUTES_PER_COUNT;
  }

  if (row.starts_at === null || row.ends_at === null) {
    return 0;
  }

  return minutesOfClock(row.ends_at) - minutesOfClock(row.starts_at);
}

function total(rows: readonly RehearsalRow[]): RehearsalTotal {
  return rows.reduce<RehearsalTotal>(
    (sum, row) => ({
      count: sum.count + (row.count ?? 1),
      minutes: sum.minutes + rehearsalHours(row),
    }),
    { count: 0, minutes: 0 },
  );
}

/**
 * 날 합계와 달 합계는 같은 셈이고 범위만 부르는 쪽이 정한다. 이름이 둘인 것은 달력 칸과 달
 * 줄이 서로 다른 것을 센다고 읽히지 않게 하려는 것이다.
 */
export { total as dayTotal, total as monthTotal };
