// 구현 대상: src/screens/schedule-admin/model/day-detail-rows.ts
//
// 날 상세는 껍데기까지다 — 근무 시간 줄과 근무 신청 줄만 이 task가 그린다. 임시공휴일
// 줄과 근무 조정 줄은 `payroll-adjust`의 것이라 이 화면이 통째로 안 그린다
// (plan AC-06 「임시공휴일 줄과 근무 조정 줄은 이 task가 안 만든다」). 근무 신청 줄은
// 0건이면 줄 자체가 없다(schedule-admin.md 「근무 신청 0건」).

import { dayDetailRows } from "@/screens/schedule-admin/model/day-detail-rows";

describe("dayDetailRows — 근무 신청이 있으면 근무 시간 줄과 근무 신청 줄이 선다", () => {
  it("신청이 1건 이상이면 hours와 applications 둘 다 선다", () => {
    const rows = dayDetailRows({ applicationCount: 2 });

    expect(rows).toEqual(["hours", "applications"]);
  });
});

describe("dayDetailRows — 근무 신청이 0건이면 그 줄이 통째로 없다", () => {
  it("신청이 0건이면 hours만 선다", () => {
    const rows = dayDetailRows({ applicationCount: 0 });

    expect(rows).toEqual(["hours"]);
  });
});

describe("dayDetailRows — 임시공휴일 줄과 근무 조정 줄은 이 task가 그리지 않는다", () => {
  it("어떤 입력에도 holiday나 adjustment가 안 낀다", () => {
    const rows = dayDetailRows({ applicationCount: 5 });

    expect(rows).not.toContain("holiday");
    expect(rows).not.toContain("adjustment");
  });
});
