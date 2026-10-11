import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import { groupRehearsalsByDate } from "@/entities/rehearsal/utils/rehearsalGrouping.utils";

function rehearsal(id: string, workDate: string): Rehearsal {
  return {
    id,
    profileId: "profile-1",
    workDate,
    startsAt: null,
    endsAt: null,
    count: 1,
    name: null,
  };
}

describe("groupRehearsalsByDate — 리허설을 근무 날짜로 묶는다", () => {
  it("같은 날짜의 리허설이 만난 순서로 한 배열에 모인다", () => {
    const first = rehearsal("rehearsal-1", "2026-10-10");
    const second = rehearsal("rehearsal-2", "2026-10-11");
    const third = rehearsal("rehearsal-3", "2026-10-10");

    const grouped = groupRehearsalsByDate([first, second, third]);

    expect(grouped.get("2026-10-10")).toEqual([first, third]);
    expect(grouped.get("2026-10-11")).toEqual([second]);
  });

  it("리허설이 없으면 빈 Map이다", () => {
    expect(groupRehearsalsByDate([]).size).toBe(0);
  });
});
