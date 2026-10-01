// 구현 대상: src/screens/schedule-admin/model/deadline-line.ts
//
// 월 달력 머리의 마감 줄이다. 문안 표(schedule-admin.md 「월 달력 문안」) 그대로다.
// 시나리오는 문서 예시와 같다 — 오늘 2026-09-29(화), 마감일 2026-10-02(금).

import { deadlineLine } from "@/screens/schedule-admin/model/deadline-line";

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
