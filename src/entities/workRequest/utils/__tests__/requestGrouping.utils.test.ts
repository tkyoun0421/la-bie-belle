import type { SlotRequest } from "@/entities/workRequest/model/workRequest.type";
import { groupRequestsByDate } from "@/entities/workRequest/utils/requestGrouping.utils";

function request(id: string, workDate: string): SlotRequest {
  return {
    id,
    slotId: `slot-${id}`,
    closedAt: null,
    expiresAt: `${workDate}T09:00:00Z`,
    candidates: [],
    positions: ["스캔"],
    workDate,
    startsAt: `${workDate}T10:00:00Z`,
    endsAt: `${workDate}T18:00:00Z`,
  };
}

describe("groupRequestsByDate — 요청을 근무 날짜로 묶는다", () => {
  it("같은 날짜의 요청이 만난 순서로 한 배열에 모인다", () => {
    const first = request("request-1", "2026-10-10");
    const second = request("request-2", "2026-10-11");
    const third = request("request-3", "2026-10-10");

    const grouped = groupRequestsByDate([first, second, third]);

    expect(grouped.get("2026-10-10")).toEqual([first, third]);
    expect(grouped.get("2026-10-11")).toEqual([second]);
  });

  it("요청이 없으면 빈 Map이다", () => {
    expect(groupRequestsByDate([]).size).toBe(0);
  });
});
