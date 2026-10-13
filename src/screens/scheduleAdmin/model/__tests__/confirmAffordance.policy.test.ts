import {
  confirmAffordance,
  confirmUnlockLine,
} from "@/screens/scheduleAdmin/model/confirmAffordance.policy";

const DEADLINE = "2026-10-02";

describe("confirmAffordance — 확정됐으면 마감·오늘과 무관하게 ended다", () => {
  it("confirmedAt이 있으면 ended다", () => {
    const affordance = confirmAffordance({
      applicationDeadline: DEADLINE,
      confirmedAt: "2026-10-03T00:00:00Z",
      now: "2026-09-01T00:00:00Z",
    });

    expect(affordance).toBe("ended");
  });
});

describe("confirmAffordance — 마감 당일은 KST로 아직 잠김이다", () => {
  it("마감일 23:59 KST(=UTC 14:59)면 locked다", () => {
    const affordance = confirmAffordance({
      applicationDeadline: DEADLINE,
      confirmedAt: null,
      now: "2026-10-02T14:59:00Z",
    });

    expect(affordance).toBe("locked");
  });
});

describe("confirmAffordance — 마감 다음 날 KST 0시부터 열린다", () => {
  it("다음 날 00:00:00 KST(=UTC 15:00 전날)가 되면 open이다", () => {
    const affordance = confirmAffordance({
      applicationDeadline: DEADLINE,
      confirmedAt: null,
      now: "2026-10-02T15:00:00Z",
    });

    expect(affordance).toBe("open");
  });

  it("마감이 한참 지났어도 open이다", () => {
    const affordance = confirmAffordance({
      applicationDeadline: DEADLINE,
      confirmedAt: null,
      now: "2026-10-20T00:00:00Z",
    });

    expect(affordance).toBe("open");
  });
});

describe("confirmAffordance — 마감 한참 전이면 locked다", () => {
  it("마감 며칠 전이면 locked다", () => {
    const affordance = confirmAffordance({
      applicationDeadline: DEADLINE,
      confirmedAt: null,
      now: "2026-09-29T00:00:00Z",
    });

    expect(affordance).toBe("locked");
  });
});

describe("confirmUnlockLine — 마감 다음 날부터 확정할 수 있다고 적는다", () => {
  it("마감 다음 날의 월 일을 적는다", () => {
    expect(confirmUnlockLine("2026-10-02")).toBe(
      "10월 3일부터 확정할 수 있어요",
    );
  });

  it("월말 마감이면 다음 달 1일이다", () => {
    expect(confirmUnlockLine("2026-10-31")).toBe(
      "11월 1일부터 확정할 수 있어요",
    );
  });
});
