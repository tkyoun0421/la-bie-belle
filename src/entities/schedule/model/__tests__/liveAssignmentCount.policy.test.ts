import { liveAssignmentCount } from "@/entities/schedule/model/liveAssignmentCount.policy";

describe("liveAssignmentCount — 끝나지 않은 배정만 센다", () => {
  const assignment = (id: string, endedAt: string | null) => ({
    id,
    slotId: null,
    position: "메인",
    kind: "regular",
    profileId: `profile-${id}`,
    endedAt,
    name: null,
  });
  const dayOf = (assignments: ReturnType<typeof assignment>[]) => ({
    id: "day-1",
    workDate: "2026-10-10",
    startsAt: "10:00:00",
    endsAt: "19:00:00",
    openedAt: "2026-10-01T00:00:00Z",
    slots: [],
    assignments,
    checkIns: [],
  });

  it("끝난 배정은 빼고 센다", () => {
    expect(
      liveAssignmentCount(
        dayOf([
          assignment("1", null),
          assignment("2", "2026-10-02T00:00:00Z"),
          assignment("3", null),
        ]),
      ),
    ).toBe(2);
  });

  it("배정이 없으면 0이다", () => {
    expect(liveAssignmentCount(dayOf([]))).toBe(0);
  });
});
