import { describe, expect, it } from "vitest";

import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";
import { toRecruitmentCellStates } from "@/views/admin-recruitment/model/recruitment-cell-state";

const MONTH = new Date(2099, 8, 1);
const TODAY = "2099-09-15";

function schedule(workDate: string, status: RecruitmentSchedule["status"]): RecruitmentSchedule {
  return { id: `schedule-${workDate}`, workDate, applicationDeadline: workDate, status };
}

describe("toRecruitmentCellStates", () => {
  it("월의 모든 날짜에 대해 셀 상태 하나씩을 만든다", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [],
      selectedDates: new Set(),
      today: TODAY,
    });

    expect(states).toHaveLength(30);
  });

  it("활성 모집(OPEN)이 있는 날짜는 open 상태이고 관리 대상으로 탭할 수 있다(disabled 아님)", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-20", "OPEN")],
      selectedDates: new Set(),
      today: TODAY,
    });

    const target = states.find((entry) => entry.date.getDate() === 20);
    expect(target?.state).toBe("open");
    expect(target?.disabled).toBeFalsy();
  });

  it("마감(CLOSED)된 날짜는 closed 상태이고 재오픈 관리 대상으로 탭할 수 있다(disabled 아님)", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-23", "CLOSED")],
      selectedDates: new Set(),
      today: TODAY,
    });

    const target = states.find((entry) => entry.date.getDate() === 23);
    expect(target?.state).toBe("closed");
    expect(target?.disabled).toBeFalsy();
  });

  it("PREPARING·CONFIRMED는 관리 범위 밖이라 open·disabled로 표시해 탭을 막는다", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-21", "PREPARING"), schedule("2099-09-22", "CONFIRMED")],
      selectedDates: new Set(),
      today: TODAY,
    });

    for (const day of [21, 22]) {
      const target = states.find((entry) => entry.date.getDate() === day);
      expect(target?.state).toBe("open");
      expect(target?.disabled).toBe(true);
    }
  });

  it("CANCELLED뿐인 날짜는 활성으로 취급하지 않고 selectable로 남긴다", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-24", "CANCELLED")],
      selectedDates: new Set(),
      today: TODAY,
    });

    const target = states.find((entry) => entry.date.getDate() === 24);
    expect(target?.state).toBe("selectable");
    expect(target?.disabled).toBeFalsy();
  });

  it("KST 오늘 이전 날짜는 none 상태다", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [],
      selectedDates: new Set(),
      today: TODAY,
    });

    const target = states.find((entry) => entry.date.getDate() === 10);
    expect(target?.state).toBe("none");
  });

  it("오늘 날짜는 경계로서 selectable이다", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [],
      selectedDates: new Set(),
      today: TODAY,
    });

    const target = states.find((entry) => entry.date.getDate() === 15);
    expect(target?.state).toBe("selectable");
  });

  it("오늘 이후 빈 날짜는 selectable이다", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [],
      selectedDates: new Set(),
      today: TODAY,
    });

    const target = states.find((entry) => entry.date.getDate() === 16);
    expect(target?.state).toBe("selectable");
  });

  it("클라이언트에서 선택한 날짜는 selected 상태이고 비활성화되지 않는다", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [],
      selectedDates: new Set(["2099-09-16"]),
      today: TODAY,
    });

    const target = states.find((entry) => entry.date.getDate() === 16);
    expect(target?.state).toBe("selected");
    expect(target?.disabled).toBeFalsy();
  });

  it("applicationCounts로 주어진 신청 수를 schedule_id로 매핑해 셀에 붙인다", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-20", "OPEN")],
      selectedDates: new Set(),
      today: TODAY,
      applicationCounts: [{ scheduleId: "schedule-2099-09-20", count: 3 }],
    });

    const target = states.find((entry) => entry.date.getDate() === 20);
    expect(target?.applicationCount).toBe(3);
  });

  it("신청 수가 0건이면 applicationCount를 부여하지 않는다(경계값)", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-20", "OPEN")],
      selectedDates: new Set(),
      today: TODAY,
      applicationCounts: [{ scheduleId: "schedule-2099-09-20", count: 0 }],
    });

    const target = states.find((entry) => entry.date.getDate() === 20);
    expect(target?.applicationCount).toBeUndefined();
  });

  it("applicationCounts를 주지 않으면 이전과 동일하게 applicationCount가 없다(하위 호환)", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-20", "OPEN")],
      selectedDates: new Set(),
      today: TODAY,
    });

    const target = states.find((entry) => entry.date.getDate() === 20);
    expect(target?.applicationCount).toBeUndefined();
  });

  it("월 경계 날짜(1일·말일)에도 신청 수를 정확히 매핑한다", () => {
    const states = toRecruitmentCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-01", "OPEN"), schedule("2099-09-30", "CLOSED")],
      selectedDates: new Set(),
      today: TODAY,
      applicationCounts: [
        { scheduleId: "schedule-2099-09-01", count: 1 },
        { scheduleId: "schedule-2099-09-30", count: 2 },
      ],
    });

    expect(states.find((entry) => entry.date.getDate() === 1)?.applicationCount).toBe(1);
    expect(states.find((entry) => entry.date.getDate() === 30)?.applicationCount).toBe(2);
  });
});
