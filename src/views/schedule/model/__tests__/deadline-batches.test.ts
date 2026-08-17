import { describe, expect, it } from "vitest";

import type { RecruitmentScheduleWithApplication } from "@/entities/schedule/model/recruitment-schedule";
import { toDeadlineBatches } from "@/views/schedule/model/deadline-batches";

const EMPTY = new Set<string>();

function schedule(
  overrides: Partial<RecruitmentScheduleWithApplication> &
    Pick<RecruitmentScheduleWithApplication, "workDate" | "applicationDeadline">,
): RecruitmentScheduleWithApplication {
  return {
    id: `schedule-${overrides.workDate}`,
    status: "OPEN",
    applicationStatus: null,
    ...overrides,
  };
}

describe("toDeadlineBatches", () => {
  it("마감일이 같은 일정을 한 묶음으로 모은다", () => {
    const batches = toDeadlineBatches({
      today: "2026-08-08",
      schedules: [
        schedule({ workDate: "2026-08-17", applicationDeadline: "2026-08-13" }),
        schedule({ workDate: "2026-08-18", applicationDeadline: "2026-08-13" }),
      ],
      pending: EMPTY,
      savedApplied: EMPTY,
    });

    expect(batches).toHaveLength(1);
    expect(batches[0]!.deadline).toBe("2026-08-13");
    expect(batches[0]!.rows.map((row) => row.workDate)).toEqual(["2026-08-17", "2026-08-18"]);
  });

  it("묶음을 마감 임박순으로 정렬하고 남은 날을 센다", () => {
    const batches = toDeadlineBatches({
      today: "2026-08-08",
      schedules: [
        schedule({ workDate: "2026-08-24", applicationDeadline: "2026-08-20" }),
        schedule({ workDate: "2026-08-17", applicationDeadline: "2026-08-13" }),
      ],
      pending: EMPTY,
      savedApplied: EMPTY,
    });

    expect(batches.map((batch) => batch.deadline)).toEqual(["2026-08-13", "2026-08-20"]);
    expect(batches.map((batch) => batch.daysLeft)).toEqual([5, 12]);
  });

  it("오늘이 마감일이면 남은 날이 0이고 아직 지나지 않았다", () => {
    const batches = toDeadlineBatches({
      today: "2026-08-13",
      schedules: [schedule({ workDate: "2026-08-17", applicationDeadline: "2026-08-13" })],
      pending: EMPTY,
      savedApplied: EMPTY,
    });

    expect(batches[0]!.daysLeft).toBe(0);
    expect(batches[0]!.deadline).toBe("2026-08-13");
  });

  it("마감이 지난 일정을 묶음 하나로 모아 맨 뒤에 둔다", () => {
    const batches = toDeadlineBatches({
      today: "2026-08-08",
      schedules: [
        schedule({
          workDate: "2026-08-04",
          applicationDeadline: "2026-08-01",
          status: "CONFIRMED",
        }),
        schedule({ workDate: "2026-08-17", applicationDeadline: "2026-08-13" }),
        schedule({ workDate: "2026-08-06", applicationDeadline: "2026-08-02", status: "CLOSED" }),
      ],
      pending: EMPTY,
      savedApplied: EMPTY,
    });

    expect(batches).toHaveLength(2);
    const past = batches.at(-1)!;
    expect(past.deadline).toBeNull();
    expect(past.daysLeft).toBeNull();
    expect(past.rows.map((row) => row.workDate)).toEqual(["2026-08-04", "2026-08-06"]);
  });

  it("취소된 일정을 뺀다", () => {
    const batches = toDeadlineBatches({
      today: "2026-08-08",
      schedules: [
        schedule({
          workDate: "2026-08-17",
          applicationDeadline: "2026-08-13",
          status: "CANCELLED",
        }),
        schedule({ workDate: "2026-08-18", applicationDeadline: "2026-08-13" }),
      ],
      pending: EMPTY,
      savedApplied: EMPTY,
    });

    expect(batches[0]!.rows.map((row) => row.workDate)).toEqual(["2026-08-18"]);
  });

  it("저장된 신청은 requested, 이번에 고른 것은 selected로 나눈다", () => {
    const batches = toDeadlineBatches({
      today: "2026-08-08",
      schedules: [
        schedule({ workDate: "2026-08-17", applicationDeadline: "2026-08-13" }),
        schedule({ workDate: "2026-08-18", applicationDeadline: "2026-08-13" }),
      ],
      pending: new Set(["2026-08-17", "2026-08-18"]),
      savedApplied: new Set(["2026-08-17"]),
    });

    expect(batches[0]!.rows.map((row) => row.state)).toEqual(["requested", "selected"]);
  });

  it("신청 가능한 행만 selectable로 표시한다", () => {
    const batches = toDeadlineBatches({
      today: "2026-08-08",
      schedules: [
        schedule({ workDate: "2026-08-17", applicationDeadline: "2026-08-13" }),
        schedule({
          workDate: "2026-08-04",
          applicationDeadline: "2026-08-01",
          status: "CONFIRMED",
        }),
      ],
      pending: EMPTY,
      savedApplied: EMPTY,
    });

    expect(batches[0]!.rows[0]!.selectable).toBe(true);
    expect(batches.at(-1)!.rows[0]!.selectable).toBe(false);
  });

  it("일정이 없으면 빈 배열을 돌려준다", () => {
    expect(
      toDeadlineBatches({
        today: "2026-08-08",
        schedules: [],
        pending: EMPTY,
        savedApplied: EMPTY,
      }),
    ).toEqual([]);
  });
});
