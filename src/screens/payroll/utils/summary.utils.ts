import { NO_VALUE } from "@/shared/consts/noValue.const";
import { spellWon } from "@/shared/utils/spellNumber";
import {
  getAttendanceStatus,
  type AttendanceStatusInput,
} from "@/entities/attendance/model/attendanceStatus.policy";
import type { PayrollDayKind } from "@/features/payrollCompute/model/payrollDays.policy";

/**
 * 금액 한 줄과 누적 두 줄이다(`docs/2-design/modules/payroll/screens/payroll.md`의 「금액」·
 * 「누적」).
 *
 * **계산할 것이 없는 기간과 합이 0인 기간이 갈린다.** 앞은 `–`고 뒤는 `0원`이다 — 결근만 있는
 * 달은 계산이 돌아서 0이 난 것이라 근무자가 그 0을 읽어야 한다. `–`는 「아직 셀 것이 없다」는
 * 뜻이고, 읽는 중에는 이 자리가 스켈레톤이라 `–`를 쓰지 않는다(「빈 상태」).
 *
 * **금액 문구는 `shared/utils/spellNumber.ts`가 소유한다.** 급여 화면과 시급 화면과 통계가 같은
 * 꼴을 써야 하는데(writing.md 「숫자와 단위」) 슬라이스마다 적으면 쉼표와 「원」이 화면마다
 * 갈린다.
 *
 * **지각 판정을 다시 짜지 않는다.** `entities/attendance`의 함수를 그대로 부른다. 배정이 없는
 * 날은 판정 대상이 아니다 — 설 자리가 없으면 늦을 자리도 없다.
 *
 * **결근과 출근 인정은 안 센다.** 결근한 날은 급여에서 빠져 내역에 사실로 서 있고, 출근 인정은
 * 배정된 시간대로 세어 근무 회수에 이미 들어 있다. 시급이 아직 없는 날은 금액에서는 빠지고
 * 회수·시간에는 든다 — 나온 날은 나온 날이다.
 */

/** 금액 자리가 비는 꼴이다. 내역 줄의 결근·시급 미정도 같은 글자를 쓴다. */
export const NO_AMOUNT = NO_VALUE;

const MINUTES_PER_HOUR = 60;

export type PayrollSummaryDay = {
  date: string;
  minutes: number;
  amount: number;
  kind: PayrollDayKind;
  attendance: AttendanceStatusInput | null;
};

export type PayrollAccrual = {
  work: string;
  late: string | null;
};

/** 누적의 시간 합이다 — 0도 「0시간」으로 적는다. 근무 회수와 나란히 서는 자리라서다. */
function spellWorkedHours(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

function isLate(day: PayrollSummaryDay): boolean {
  return (
    day.attendance !== null && getAttendanceStatus(day.attendance) === "late"
  );
}

export function summarizeAmount(days: readonly PayrollSummaryDay[]): string {
  if (days.length === 0) {
    return NO_AMOUNT;
  }

  return spellWon(days.reduce((sum, day) => sum + day.amount, 0));
}

export function summarizeAccrual(
  days: readonly PayrollSummaryDay[],
): PayrollAccrual {
  const worked = days.filter((day) => day.kind !== "absent");
  const late = days.filter(isLate).length;
  const minutes = worked.reduce((sum, day) => sum + day.minutes, 0);

  return {
    work: `${worked.length}회 · ${spellWorkedHours(minutes)}`,
    late: late === 0 ? null : `${late}회`,
  };
}
