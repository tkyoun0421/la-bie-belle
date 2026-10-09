import {
  toOpenSlot,
  toScheduleDay,
} from "@/entities/schedule/utils/schedule.mapper";

const DAY = {
  id: "d1",
  work_date: "2026-10-20",
  starts_at: "10:00:00",
  ends_at: "22:00:00",
  opened_at: "2026-09-20T00:00:00Z",
  slots: [{ id: "s1", positions: ["서빙"], ended_at: null }],
  assignments: [
    {
      id: "a1",
      slot_id: "s1",
      position: "서빙",
      kind: "regular",
      profile_id: "p1",
      ended_at: null,
      profiles: { display_name: "홍길동" },
    },
  ],
  check_ins: [
    {
      id: "c1",
      profile_id: "p1",
      checked_at: "2026-10-20T01:00:00Z",
      reported_at: "2026-10-20T01:01:00Z",
      received_at: "2026-10-20T01:02:00Z",
    },
  ],
};

describe("toScheduleDay — 품은 배열 셋을 각자 옮긴다", () => {
  it("날의 세 때가 뒤바뀌지 않는다", () => {
    const day = toScheduleDay(DAY);

    expect(day.workDate).toBe("2026-10-20");
    expect(day.startsAt).toBe("10:00:00");
    expect(day.endsAt).toBe("22:00:00");
    expect(day.openedAt).toBe("2026-09-20T00:00:00Z");
  });

  it("`check_ins`가 `checkIns`로 오고 때 셋이 제자리로 간다", () => {
    const [checkIn] = toScheduleDay(DAY).checkIns;

    expect(checkIn.checkedAt).toBe("2026-10-20T01:00:00Z");
    expect(checkIn.reportedAt).toBe("2026-10-20T01:01:00Z");
    expect(checkIn.receivedAt).toBe("2026-10-20T01:02:00Z");
  });

  it("배정의 이름은 조인으로 온 남의 것이라 `name`이다", () => {
    const [assignment] = toScheduleDay(DAY).assignments;

    expect(assignment.name).toBe("홍길동");
    expect(assignment.profileId).toBe("p1");
    expect(assignment.slotId).toBe("s1");
  });

  it("자리와 배정이 각자 제 `ended_at`을 든다", () => {
    const day = toScheduleDay({
      ...DAY,
      slots: [{ id: "s1", positions: ["서빙"], ended_at: "2026-10-19" }],
    });

    expect(day.slots[0].endedAt).toBe("2026-10-19");
    expect(day.assignments[0].endedAt).toBeNull();
  });

  it("조인이 빈 배정도 선다", () => {
    const day = toScheduleDay({
      ...DAY,
      assignments: [{ ...DAY.assignments[0], profiles: null }],
    });

    expect(day.assignments[0].name).toBeNull();
  });

  it("빈 날은 배열 셋이 다 빈다", () => {
    const day = toScheduleDay({
      ...DAY,
      slots: [],
      assignments: [],
      check_ins: [],
    });

    expect(day.slots).toEqual([]);
    expect(day.assignments).toEqual([]);
    expect(day.checkIns).toEqual([]);
  });
});

describe("toOpenSlot — 뷰의 빈 열은 줄을 버린다", () => {
  const ROW = {
    slot_id: "s1",
    day_id: "d1",
    work_date: "2026-10-20",
    positions: ["서빙"],
  };

  it("넷이 다 차면 옮긴다", () => {
    expect(toOpenSlot(ROW)).toEqual({
      slotId: "s1",
      dayId: "d1",
      workDate: "2026-10-20",
      positions: ["서빙"],
    });
  });

  it("자리와 날이 섞이지 않는다", () => {
    const slot = toOpenSlot(ROW);

    expect(slot?.slotId).toBe("s1");
    expect(slot?.dayId).toBe("d1");
  });

  it("넷 중 하나라도 비면 null이다", () => {
    expect(toOpenSlot({ ...ROW, slot_id: null })).toBeNull();
    expect(toOpenSlot({ ...ROW, day_id: null })).toBeNull();
    expect(toOpenSlot({ ...ROW, work_date: null })).toBeNull();
    expect(toOpenSlot({ ...ROW, positions: null })).toBeNull();
  });
});
