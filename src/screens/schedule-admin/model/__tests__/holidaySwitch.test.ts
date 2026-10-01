// 구현 대상: src/screens/schedule-admin/model/holiday-switch.ts
//
// 임시공휴일 스위치의 켜짐·잠김과 아래 줄 문구다(payroll-adjust AC-01). 판정은 그 날짜의
// `holidays` 행에 `source = 'api'`가 있는가 하나고, 같은 날짜에 `manual`이 같이 있어도
// 잠금이 이긴다(payroll-adjust plan 「받아온 공휴일인 날은 켜진 채 잠긴다」).
// 문안은 schedule-admin.md 「날 상세 문안」 표 그대로다.

import {
  holidaySwitchState,
  type HolidayRow,
} from "@/screens/schedule-admin/model/holiday-switch";

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
