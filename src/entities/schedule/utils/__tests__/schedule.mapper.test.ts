import { toMonthWindow } from "@/entities/schedule/utils/schedule.mapper";

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
