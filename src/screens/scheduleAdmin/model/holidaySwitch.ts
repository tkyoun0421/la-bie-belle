/**
 * 날 상세 임시공휴일 줄의 스위치 상태와 아래 줄 문구다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「날 상세 짜임」과 「날 상세
 * 문안」이다.
 *
 * **판정은 `api` 행의 유무 하나다.** 같은 날짜에 받아온 행과 손으로 넣은 행이 같이 설 수 있고
 * (`docs/2-design/modules/payroll/design.md`의 「공휴일」) 그때는 잠금이 이긴다 — 받아온 값을
 * 관리자가 화면에서 지우는 길을 안 연다.
 *
 * **확정과 무관하다.** 임시공휴일 지정이 근무표 확정을 안 기다린다(PAY-027).
 */

export type HolidayRow = {
  source: string;
};

export type HolidaySwitchState = {
  checked: boolean;
  locked: boolean;
  helperLine: string;
};

const API_SOURCE = "api";

const CAN_TOGGLE_LINE = "급여를 셀 때 공휴일로 봐요";

const LOCKED_LINE = "원래 공휴일이에요";

export function holidaySwitchState(
  rows: readonly HolidayRow[],
): HolidaySwitchState {
  const locked = rows.some((row) => row.source === API_SOURCE);

  return {
    checked: rows.length > 0,
    locked,
    helperLine: locked ? LOCKED_LINE : CAN_TOGGLE_LINE,
  };
}
