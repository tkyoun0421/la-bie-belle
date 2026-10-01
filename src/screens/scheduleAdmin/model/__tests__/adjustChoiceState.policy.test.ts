// 구현 대상: src/screens/scheduleAdmin/model/adjustChoiceState.policy.ts
//
// 조정 고르기 시트의 「원래대로」 노출 여부다(payroll-adjust AC-04). 조건은 조정 행이
// 하나라도 있는 것이다 — 마지막 행이 0분이어도(이미 되돌린 사람이어도) 선다. 세는 축과
// 보여주는 축이 다르다: 「N명 조정됨」은 마지막 행의 분을 보지만 이 노출 여부는 행의
// 유무만 본다(schedule-admin.md 「근무 조정」).

import { showRevertOption } from "@/screens/scheduleAdmin/model/adjustChoiceState.policy";

describe("showRevertOption — 조정 행이 없으면 원래대로가 안 선다", () => {
  it("빈 배열이면 false다", () => {
    expect(showRevertOption([])).toBe(false);
  });
});

describe("showRevertOption — 조정 행이 하나라도 있으면 원래대로가 선다", () => {
  it("결근이 든 행 하나만 있어도 true다", () => {
    expect(showRevertOption([{ minutes: -540 }])).toBe(true);
  });

  it("마지막 행이 0분이어도(이미 되돌린 사람이어도) true다", () => {
    expect(showRevertOption([{ minutes: -540 }, { minutes: 0 }])).toBe(true);
  });
});
