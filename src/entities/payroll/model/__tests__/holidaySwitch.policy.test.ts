import {
  holidaySwitchState,
  type HolidayRow,
} from "@/entities/payroll/model/holidaySwitch.policy";

const CAN_TOGGLE_LINE = "급여를 셀 때 공휴일로 봐요";

const LOCKED_LINE = "원래 공휴일이에요";

describe("holidaySwitchState — 행이 없으면 꺼진 채 손댈 수 있다", () => {
  it("checked가 false, locked가 false, 문구가 켤 수 있을 때의 것이다", () => {
    const rows: HolidayRow[] = [];

    const state = holidaySwitchState(rows);

    expect(state).toEqual({
      checked: false,
      locked: false,
      helperLine: CAN_TOGGLE_LINE,
    });
  });
});

describe("holidaySwitchState — manual 행만 있으면 켜진 채 손댈 수 있다", () => {
  it("checked가 true, locked가 false다", () => {
    const rows: HolidayRow[] = [{ source: "manual" }];

    const state = holidaySwitchState(rows);

    expect(state).toEqual({
      checked: true,
      locked: false,
      helperLine: CAN_TOGGLE_LINE,
    });
  });
});

describe("holidaySwitchState — api 행만 있으면 켜진 채 잠긴다", () => {
  it("checked가 true, locked가 true, 문구가 「원래 공휴일이에요」다", () => {
    const rows: HolidayRow[] = [{ source: "api" }];

    const state = holidaySwitchState(rows);

    expect(state).toEqual({
      checked: true,
      locked: true,
      helperLine: LOCKED_LINE,
    });
  });
});

describe("holidaySwitchState — api와 manual이 공존하면 잠금이 이긴다", () => {
  it("manual이 같이 있어도 locked가 true다", () => {
    const rows: HolidayRow[] = [{ source: "api" }, { source: "manual" }];

    const state = holidaySwitchState(rows);

    expect(state).toEqual({
      checked: true,
      locked: true,
      helperLine: LOCKED_LINE,
    });
  });
});
