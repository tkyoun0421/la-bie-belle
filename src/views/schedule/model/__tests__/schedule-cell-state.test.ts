import { describe, expect, it } from "vitest";

import type { RecruitmentScheduleWithApplication } from "@/entities/schedule/model/recruitment-schedule";
import { toScheduleCellStates } from "@/views/schedule/model/schedule-cell-state";

const MONTH = new Date(2099, 8, 1);

function schedule(
  workDate: string,
  status: RecruitmentScheduleWithApplication["status"],
  applicationStatus: RecruitmentScheduleWithApplication["applicationStatus"] = null,
): RecruitmentScheduleWithApplication {
  return {
    id: `schedule-${workDate}`,
    workDate,
    applicationDeadline: workDate,
    status,
    applicationStatus,
  };
}

describe("toScheduleCellStates", () => {
  it("월의 모든 날짜에 대해 셀 상태 하나씩을 만든다", () => {
    const states = toScheduleCellStates({
      month: MONTH,
      schedules: [],
      pending: new Set(),
      savedApplied: new Set(),
    });

    expect(states).toHaveLength(30);
  });

  it("스케줄이 없는 날짜는 none 상태다", () => {
    const states = toScheduleCellStates({
      month: MONTH,
      schedules: [],
      pending: new Set(),
      savedApplied: new Set(),
    });

    const target = states.find((entry) => entry.date.getDate() === 5);
    expect(target?.state).toBe("none");
  });

  it("OPEN 스케줄이고 미선택·미신청이면 open 상태다", () => {
    const states = toScheduleCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-05", "OPEN")],
      pending: new Set(),
      savedApplied: new Set(),
    });

    const target = states.find((entry) => entry.date.getDate() === 5);
    expect(target?.state).toBe("open");
  });

  it("CONFIRMED 스케줄은 pending 여부와 무관하게 confirmed 상태다", () => {
    const states = toScheduleCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-06", "CONFIRMED", "applied")],
      pending: new Set(["2099-09-06"]),
      savedApplied: new Set(["2099-09-06"]),
    });

    const target = states.find((entry) => entry.date.getDate() === 6);
    expect(target?.state).toBe("confirmed");
  });

  it.each(["CLOSED", "PREPARING"] as const)("%s 스케줄은 closed 상태다", (status) => {
    const states = toScheduleCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-07", status)],
      pending: new Set(),
      savedApplied: new Set(),
    });

    const target = states.find((entry) => entry.date.getDate() === 7);
    expect(target?.state).toBe("closed");
  });

  it("CANCELLED뿐인 날짜는 활성으로 취급하지 않고 none이다", () => {
    const states = toScheduleCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-08", "CANCELLED")],
      pending: new Set(),
      savedApplied: new Set(),
    });

    const target = states.find((entry) => entry.date.getDate() === 8);
    expect(target?.state).toBe("none");
  });

  it("OPEN이고 pending에 있지만 savedApplied가 아니면 selected다", () => {
    const states = toScheduleCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-09", "OPEN")],
      pending: new Set(["2099-09-09"]),
      savedApplied: new Set(),
    });

    const target = states.find((entry) => entry.date.getDate() === 9);
    expect(target?.state).toBe("selected");
  });

  it("OPEN이고 pending·savedApplied에 모두 있으면 requested다", () => {
    const states = toScheduleCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-10", "OPEN", "applied")],
      pending: new Set(["2099-09-10"]),
      savedApplied: new Set(["2099-09-10"]),
    });

    const target = states.find((entry) => entry.date.getDate() === 10);
    expect(target?.state).toBe("requested");
  });

  it("savedApplied에는 있지만 pending에서 빠지면(철회 예정) open으로 되돌아간다", () => {
    const states = toScheduleCellStates({
      month: MONTH,
      schedules: [schedule("2099-09-11", "OPEN", "applied")],
      pending: new Set(),
      savedApplied: new Set(["2099-09-11"]),
    });

    const target = states.find((entry) => entry.date.getDate() === 11);
    expect(target?.state).toBe("open");
  });
});
