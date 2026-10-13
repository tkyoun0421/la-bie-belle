import {
  toMonthWindow,
  toScheduleDay,
  toOpenSlot,
} from "@/entities/schedule/utils/schedule.mapper";

describe("toMonthWindow — 근무표 행을 도메인 모양으로 옮긴다", () => {
  it("두 열이 다 찼으면 둘 다 옮긴다", () => {
    expect(
      toMonthWindow({
        application_deadline: "2026-10-20T14:59:59Z",
        confirmed_at: "2026-10-25T01:00:00Z",
      }),
    ).toEqual({
      applicationDeadline: "2026-10-20T14:59:59Z",
      confirmedAt: "2026-10-25T01:00:00Z",
    });
  });

  it("마감이 비면 아직 안 열린 달이다 — null을 null로 옮긴다", () => {
    expect(
      toMonthWindow({ application_deadline: null, confirmed_at: null }),
    ).toEqual({ applicationDeadline: null, confirmedAt: null });
  });

  it("마감만 찼으면 접수는 열렸고 확정은 안 됐다", () => {
    expect(
      toMonthWindow({
        application_deadline: "2026-10-20T14:59:59Z",
        confirmed_at: null,
      }),
    ).toEqual({
      applicationDeadline: "2026-10-20T14:59:59Z",
      confirmedAt: null,
    });
  });
});

describe("toScheduleDay — 하루 행을 도메인 모양으로 옮긴다", () => {
  it("열 이름을 camelCase로 바꾸고 안쪽 행도 옮긴다", () => {
    expect(
      toScheduleDay({
        id: "day-1",
        work_date: "2026-10-10",
        starts_at: "10:00:00",
        ends_at: "19:00:00",
        opened_at: "2026-10-01T00:00:00Z",
        slots: [{ id: "slot-1", positions: ["메인"], ended_at: null }],
        assignments: [
          {
            id: "assignment-1",
            slot_id: "slot-1",
            position: "메인",
            kind: "regular",
            profile_id: "profile-1",
            ended_at: null,
            profiles: { display_name: "김지우" },
          },
        ],
        check_ins: [
          {
            id: "check-in-1",
            profile_id: "profile-1",
            checked_at: "2026-10-10T00:50:00Z",
            reported_at: "2026-10-10T00:50:01Z",
            received_at: "2026-10-10T00:50:02Z",
          },
        ],
      }),
    ).toEqual({
      id: "day-1",
      workDate: "2026-10-10",
      startsAt: "10:00:00",
      endsAt: "19:00:00",
      openedAt: "2026-10-01T00:00:00Z",
      slots: [{ id: "slot-1", positions: ["메인"], endedAt: null }],
      assignments: [
        {
          id: "assignment-1",
          slotId: "slot-1",
          position: "메인",
          kind: "regular",
          profileId: "profile-1",
          endedAt: null,
          name: "김지우",
        },
      ],
      checkIns: [
        {
          id: "check-in-1",
          profileId: "profile-1",
          checkedAt: "2026-10-10T00:50:00Z",
          reportedAt: "2026-10-10T00:50:01Z",
          receivedAt: "2026-10-10T00:50:02Z",
        },
      ],
    });
  });

  it("배정에 프로필이 없으면 이름은 null이다", () => {
    const day = toScheduleDay({
      id: "day-1",
      work_date: "2026-10-10",
      starts_at: "10:00:00",
      ends_at: "19:00:00",
      opened_at: "2026-10-01T00:00:00Z",
      slots: [],
      assignments: [
        {
          id: "assignment-1",
          slot_id: null,
          position: "메인",
          kind: "regular",
          profile_id: "profile-1",
          ended_at: null,
          profiles: null,
        },
      ],
      check_ins: [],
    });

    expect(day.assignments[0].name).toBeNull();
  });
});

describe("toOpenSlot — 빈 자리 행을 도메인 모양으로 옮긴다", () => {
  it("네 열이 다 찼으면 옮긴다", () => {
    expect(
      toOpenSlot({
        slot_id: "slot-1",
        day_id: "day-1",
        work_date: "2026-10-10",
        positions: ["메인"],
      }),
    ).toEqual({
      slotId: "slot-1",
      dayId: "day-1",
      workDate: "2026-10-10",
      positions: ["메인"],
    });
  });

  it("열 하나라도 null이면 null이다", () => {
    expect(
      toOpenSlot({
        slot_id: "slot-1",
        day_id: null,
        work_date: "2026-10-10",
        positions: ["메인"],
      }),
    ).toBeNull();
  });
});
