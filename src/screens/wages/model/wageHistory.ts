import { wageAt } from "@/entities/payroll/model/wageAt";

/**
 * 사람 시트 안의 이력이다. 최근이 위고 눌리지 않는다 — 지난 급여가 흔들리면 안 돼서 고치는
 * 문을 안 둔다([PAY-010](../../../../docs/2-design/modules/payroll/README.md#pay-010)).
 *
 * **줄이 하나뿐이면 안 그린다.** 승인되고 아직 한 번도 안 바꾼 사람이고, 지금 값은 입력
 * 칸에 이미 있다.
 *
 * **세 줄까지 보이고 넘치면 「더 보기」다.** 줄 하나가 대략 한 해라 셋이면 3년치고, 이력에서
 * 실제로 찾는 것은 첫 줄에 있다. 펼치면 나머지가 그 자리에 선다.
 */

export type WageHistoryRow = {
  effective_date: string;
  amount: number;
};

export type WageHistory = {
  rows: WageHistoryRow[];
  hasMore: boolean;
};

const HISTORY_SHOWN = 3;

export function buildWageHistory(
  rows: readonly WageHistoryRow[],
  expanded = false,
): WageHistory {
  if (rows.length <= 1) {
    return { rows: [], hasMore: false };
  }

  const recent = [...rows].sort((left, right) =>
    right.effective_date.localeCompare(left.effective_date),
  );

  if (expanded) {
    return { rows: recent, hasMore: false };
  }

  return {
    rows: recent.slice(0, HISTORY_SHOWN),
    hasMore: recent.length > HISTORY_SHOWN,
  };
}

/**
 * 시트를 열 때 칸에 채워지는 값이다. 기본을 쓰는 사람도 그 값이 채워져 있고, 고쳐 저장하면
 * 그때부터 개별이 된다.
 *
 * **채울 값이 없으면 `null`이다.** 시급 이력이 빈 사람이고 0원을 안 채운다 — 0원은 정해진
 * 값처럼 읽히는데 아직 아무것도 안 정해졌다.
 *
 * 기준일을 인자로 받는 것은 오늘을 읽는 손이 화면에 하나여야 하기 때문이다 — 부르는 쪽이
 * `kstToday()`를 넘긴다.
 */
export function prefillWageAmount(
  rates: readonly WageHistoryRow[],
  today: string,
): number | null {
  return wageAt(rates, today);
}

/** 「2026년 8월 1일」 — 이력은 해를 넘겨 쌓이는 자리라 연도가 붙는다(writing.md). */
export function spellWageDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return `${year}년 ${month}월 ${day}일`;
}
