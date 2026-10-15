import { deadlineLine } from "@/entities/schedule/utils/deadlineLine.utils";

describe("deadlineLine — 마감 전에는 날짜와 요일, 남은 날을 말한다", () => {
  it("오늘이 9월 29일이면 「스케줄 신청 마감 10월 2일(금) · 3일 남았어요」다", () => {
    const line = deadlineLine({
      applicationDeadline: "2026-10-02",
      now: "2026-09-29T00:00:00Z",
    });

    expect(line).toBe("스케줄 신청 마감 10월 2일(금) · 3일 남았어요");
  });
});

describe("deadlineLine — 마감이 지나면 마감됐다는 문장으로 갈린다", () => {
  it("마감 다음날이면 「스케줄 신청이 10월 2일에 마감됐어요」다", () => {
    const line = deadlineLine({
      applicationDeadline: "2026-10-02",
      now: "2026-10-03T00:00:00Z",
    });

    expect(line).toBe("스케줄 신청이 10월 2일에 마감됐어요");
  });
});

describe("deadlineLine — 신청 마감까지 남은 날을 한 줄로 적는다", () => {
  it("남은 날이 있으면 마감 날짜와 남은 일수를 적는다", () => {
    expect(
      deadlineLine({ applicationDeadline: "2026-10-10", now: "2026-10-07" }),
    ).toBe("스케줄 신청 마감 10월 10일(토) · 3일 남았어요");
  });

  it("마감 당일이면 오늘까지라고 적는다", () => {
    expect(
      deadlineLine({ applicationDeadline: "2026-10-10", now: "2026-10-10" }),
    ).toBe("스케줄 신청 마감 10월 10일(토) · 오늘까지예요");
  });

  it("마감이 지났으면 마감됐다고 적는다", () => {
    expect(
      deadlineLine({ applicationDeadline: "2026-10-10", now: "2026-10-11" }),
    ).toBe("스케줄 신청이 10월 10일에 마감됐어요");
  });
});
