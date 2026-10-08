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
