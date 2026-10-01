// 구현 대상: src/screens/scheduleAdmin/utils/formatScheduleDate.utils.ts
//
// 날짜 표기(schedule-admin.md 「표기」) — 「10월 10일(토)」와 확정 줄 「10월 3일에
// 확정했어요 · 14명에게 알림을 보냈어요」(같은 문서 「확정 뒤 짜임」). `work_date`는
// 시각 없는 KST 달력 날짜라 UTC 자정으로 읽는다. `confirmed_at`은 실제 타임스탬프라
// Asia/Seoul로 변환해야 달력 날짜가 맞는다.

import {
  confirmedLine,
  formatScheduleDate,
} from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";

describe("formatScheduleDate — 「N월 N일(요일)」 꼴이다", () => {
  it("2026-10-10은 「10월 10일(토)」다", () => {
    expect(formatScheduleDate("2026-10-10")).toBe("10월 10일(토)");
  });
});

describe("confirmedLine — 확정한 날과 알림 받은 인원 수를 말한다", () => {
  it("확정 시각이 KST로 아직 그날이면 그 날짜를 쓴다", () => {
    const line = confirmedLine({
      confirmedAt: "2026-10-03T00:30:00Z",
      notifiedCount: 14,
    });

    expect(line).toBe("10월 3일에 확정했어요 · 14명에게 알림을 보냈어요");
  });

  it("확정 시각이 UTC로는 전날이어도 KST로 넘어갔으면 다음 날짜를 쓴다", () => {
    const line = confirmedLine({
      confirmedAt: "2026-10-02T15:30:00Z",
      notifiedCount: 14,
    });

    expect(line).toBe("10월 3일에 확정했어요 · 14명에게 알림을 보냈어요");
  });
});
