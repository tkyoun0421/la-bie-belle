import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";
import { indexDaysByDate } from "@/entities/schedule/utils/dayIndex.utils";

function day(id: string, workDate: string): ScheduleDay {
  return {
    id,
    workDate,
    startsAt: `${workDate}T10:00:00Z`,
    endsAt: `${workDate}T18:00:00Z`,
    openedAt: `${workDate}T00:00:00Z`,
    slots: [],
    assignments: [],
    checkIns: [],
  };
}

describe("indexDaysByDate — 근무일을 날짜로 찾게 꽂는다", () => {
  it("날짜마다 그 날의 근무일이 선다", () => {
    const days = [day("day-1", "2026-10-10"), day("day-2", "2026-10-11")];

    const indexed = indexDaysByDate(days);

    expect(indexed.get("2026-10-10")).toBe(days[0]);
    expect(indexed.get("2026-10-11")).toBe(days[1]);
  });

  it("같은 날짜가 둘이면 나중 것이 이긴다", () => {
    const later = day("day-2", "2026-10-10");

    expect(
      indexDaysByDate([day("day-1", "2026-10-10"), later]).get("2026-10-10"),
    ).toBe(later);
  });

  it("없는 날짜를 물으면 undefined다", () => {
    expect(indexDaysByDate([]).get("2026-10-10")).toBeUndefined();
  });
});
