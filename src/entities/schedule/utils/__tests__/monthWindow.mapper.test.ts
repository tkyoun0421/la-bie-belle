// 구현 대상: src/entities/schedule/utils/monthWindow.mapper.ts
//
// 근무표 행의 DB 열 이름을 도메인 모양으로 옮긴다. 두 열이 각자 비는 꼴을 그대로 옮겨야
// 「아직 안 열린 달」과 「접수는 끝났어도 확정 전」이 화면에서 갈린다.

import { toMonthWindow } from "@/entities/schedule/utils/monthWindow.mapper";

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
