import { dayDetailRows } from "@/screens/scheduleAdmin/utils/dayDetailRows.utils";

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
