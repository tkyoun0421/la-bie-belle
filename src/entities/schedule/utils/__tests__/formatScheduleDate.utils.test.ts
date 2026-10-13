import {
  confirmedLine,
  formatScheduleDate,
  formatBareDate,
  formatMonthName,
  formatMonthTitle,
} from "@/entities/schedule/utils/formatScheduleDate.utils";

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

describe("formatBareDate — 요일 없이 월 일만 적는다", () => {
  it("앞 영을 뗀다", () => {
    expect(formatBareDate("2026-10-05")).toBe("10월 5일");
  });
});

describe("formatMonthName — 월 이름만 적는다", () => {
  it("앞 영을 떼고 월을 붙인다", () => {
    expect(formatMonthName("2026-03")).toBe("3월");
  });
});

describe("formatMonthTitle — 연과 월을 적는다", () => {
  it("연 월 꼴이다", () => {
    expect(formatMonthTitle("2026-03")).toBe("2026년 3월");
  });
});
