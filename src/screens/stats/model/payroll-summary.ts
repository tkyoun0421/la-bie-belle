import type { PayrollDayKind } from "@/features/payroll/model/payroll-days";

/**
 * 급여 탭 보조 줄이다 — 「근무 12건 · 108시간」
 * (`docs/2-design/system/screens/stats.md`의 「내 급여」).
 *
 * **위 금액과 같은 날들을 센다.** 결근한 날은 빠지고 시급이 아직 없는 날은 든다 — 급여 조회의
 * 「누적」과 같은 셈이다(`docs/2-design/modules/payroll/screens/payroll.md`). 포지션 탭의
 * 건수가 산 배정을 다 세는 것과 갈리는데, 이 줄은 위 금액이 어디서 나왔는지를 말하는 자리라
 * 금액과 같은 날을 세야 한다. 결근한 날을 세면 「12건인데 11일치 돈」이 된다.
 *
 * 같은 셈을 급여 화면이 제 슬라이스에 들고 있는데 슬라이스끼리는 서로를 못 부른다
 * (lint 규칙 3) — 금액을 내는 `features/payroll`을 부르는 자리가 여기라 이 셈도 여기 선다.
 */

const MINUTES_PER_HOUR = 60;

const ABSENT: PayrollDayKind = "absent";

export type MyPayrollDay = {
  minutes: number;
  kind: PayrollDayKind;
};

export function myPayrollSubtitle(days: readonly MyPayrollDay[]): string {
  const worked = days.filter((day) => day.kind !== ABSENT);
  const minutes = worked.reduce((sum, day) => sum + day.minutes, 0);

  return `근무 ${worked.length}건 · ${spellWorkedHours(minutes)}`;
}

/** 0도 「0시간」으로 적는다 — 건수와 나란히 서는 자리라서다. */
function spellWorkedHours(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}
