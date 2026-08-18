import { describe, expect, it } from "vitest";

import { toUpcomingShifts } from "@/views/home/model/upcoming-shifts";
import type { Shift } from "@/views/home/model/home-view-model";

const TODAY = "2026-08-18";

function shift(date: string, position = "홀서빙"): Shift {
  return { date, position, startTime: "14:00", endTime: "22:00" };
}

describe("toUpcomingShifts — 라운드 22·27, 내일부터 D-n 오름차순 최대 3건", () => {
  it("오늘 근무는 빠지고 내일(D-1)부터 담는다", () => {
    const result = toUpcomingShifts([shift(TODAY), shift("2026-08-19")], TODAY);

    expect(result).toHaveLength(1);
    expect(result[0]?.date).toBe("2026-08-19");
  });

  it("최대 3건까지만 담고 나머지는 잘린다", () => {
    const shifts = [
      shift("2026-08-19"),
      shift("2026-08-20"),
      shift("2026-08-22"),
      shift("2026-08-25"),
    ];

    const result = toUpcomingShifts(shifts, TODAY);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.date)).toEqual(["2026-08-19", "2026-08-20", "2026-08-22"]);
  });

  it("입력이 뒤섞여 있어도 출력은 D-n 오름차순으로 정렬된다", () => {
    const shifts = [shift("2026-08-22"), shift("2026-08-19"), shift("2026-08-20")];

    const result = toUpcomingShifts(shifts, TODAY);

    expect(result.map((item) => item.date)).toEqual(["2026-08-19", "2026-08-20", "2026-08-22"]);
  });

  it("D-n을 오늘 날짜 기준 오름차순 정수로 낸다", () => {
    const shifts = [shift("2026-08-19"), shift("2026-08-20"), shift("2026-08-22")];

    const result = toUpcomingShifts(shifts, TODAY);

    expect(result.map((item) => item.daysUntil)).toEqual([1, 2, 4]);
  });

  it("근무가 없으면 빈 배열을 낸다", () => {
    expect(toUpcomingShifts([], TODAY)).toEqual([]);
  });

  it("포지션과 근무 시간을 그대로 담는다", () => {
    const result = toUpcomingShifts([shift("2026-08-19", "주방보조")], TODAY);

    expect(result[0]).toMatchObject({ position: "주방보조", startTime: "14:00", endTime: "22:00" });
  });

  it("D-1은 배지 층위가 d1이다 — shared/ui/d-badge.tsx의 tier 어휘와 같다", () => {
    const result = toUpcomingShifts([shift("2026-08-19")], TODAY);

    expect(result[0]?.tier).toBe("d1");
    expect(result[0]?.label).toBe("D-1");
  });

  it("D-2는 배지 층위가 d2다", () => {
    const result = toUpcomingShifts([shift("2026-08-20")], TODAY);

    expect(result[0]?.tier).toBe("d2");
    expect(result[0]?.label).toBe("D-2");
  });

  it("D-3부터는 회색(neutral)이다 — 라운드 27, 진한 파랑은 D-2까지만", () => {
    const result = toUpcomingShifts([shift("2026-08-21")], TODAY);

    expect(result[0]?.tier).toBe("neutral");
    expect(result[0]?.label).toBe("D-3");
  });

  it("D-0은 만들지 않는다 — 오늘 근무는 이 목록에 들어오지 않는다", () => {
    const result = toUpcomingShifts([shift(TODAY), shift("2026-08-19")], TODAY);

    expect(result.some((item) => item.daysUntil === 0)).toBe(false);
  });
});
