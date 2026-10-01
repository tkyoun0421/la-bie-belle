import { monthState } from "@/screens/scheduleWorker/model/monthState.policy";

describe("monthState — 근무표가 없으면 안 만든 달이다", () => {
  it("schedule이 null이면 not_created다", () => {
    const state = monthState({ schedule: null, today: "2026-10-01" });

    expect(state).toBe("not_created");
  });
});

describe("monthState — 확정되면 마감·오늘과 무관하게 confirmed다", () => {
  it("confirmedAt이 있으면 confirmed다", () => {
    const state = monthState({
      schedule: {
        applicationDeadline: "2026-10-02",
        confirmedAt: "2026-10-05T00:00:00+09:00",
      },
      today: "2026-10-20",
    });

    expect(state).toBe("confirmed");
  });
});

describe("monthState — 마감일 경계는 당일까지 접수 중이다", () => {
  it("오늘이 마감일 당일이면 collecting이다", () => {
    const state = monthState({
      schedule: { applicationDeadline: "2026-10-02", confirmedAt: null },
      today: "2026-10-02",
    });

    expect(state).toBe("collecting");
  });

  it("오늘이 마감 다음날이면 closed_awaiting_confirmation이다", () => {
    const state = monthState({
      schedule: { applicationDeadline: "2026-10-02", confirmedAt: null },
      today: "2026-10-03",
    });

    expect(state).toBe("closed_awaiting_confirmation");
  });

  it("마감 전이면 collecting이다", () => {
    const state = monthState({
      schedule: { applicationDeadline: "2026-10-02", confirmedAt: null },
      today: "2026-09-25",
    });

    expect(state).toBe("collecting");
  });
});
