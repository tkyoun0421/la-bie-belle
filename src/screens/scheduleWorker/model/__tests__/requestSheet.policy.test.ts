// 구현 대상: src/screens/scheduleWorker/model/requestSheet.ts
//
// 근무 요청 시트가 정상인지 끝났는지를 가른다(schedule-worker.md 「근무 요청 시트」의
// 「끝난 요청」 상태). 서버가 닫았으면(`closed_at`) 물론이고, cron이 아직 안 돈
// 사이에도 카운트다운이 0이 되면(만료 시각이 지나면) 로컬에서 곧장 끝난 요청으로
// 본다 — design.md 「요청」의 "만료됨은 저장하지 않는다"와 runtime.md 「서버 시각」의
// 로컬 판정이 같은 결이다.

import { requestSheetState } from "@/screens/scheduleWorker/model/requestSheet.policy";

const EXPIRES_AT = "2026-10-12T00:00:00Z";

describe("requestSheetState — 닫히지도 안 지나지도 않았으면 정상이다", () => {
  it("closed_at이 없고 아직 만료 전이면 normal이다", () => {
    const serverNowMs = new Date("2026-10-11T00:00:00Z").getTime();

    const state = requestSheetState({
      closedAt: null,
      expiresAt: EXPIRES_AT,
      serverNowMs,
    });

    expect(state).toBe("normal");
  });
});

describe("requestSheetState — 서버가 요청을 닫았으면 끝난 요청이다", () => {
  it("closed_at이 있으면 ended다", () => {
    const serverNowMs = new Date("2026-10-11T00:00:00Z").getTime();

    const state = requestSheetState({
      closedAt: "2026-10-11T12:00:00Z",
      expiresAt: EXPIRES_AT,
      serverNowMs,
    });

    expect(state).toBe("ended");
  });
});

describe("requestSheetState — cron이 아직 안 돌았어도 카운트다운이 0이면 끝난 요청이다", () => {
  it("closed_at이 없어도 expiresAt이 serverNowMs보다 지났으면 ended다", () => {
    const serverNowMs = new Date("2026-10-13T00:00:00Z").getTime();

    const state = requestSheetState({
      closedAt: null,
      expiresAt: EXPIRES_AT,
      serverNowMs,
    });

    expect(state).toBe("ended");
  });

  it("정확히 만료 시각이면 이미 끝난 요청이다", () => {
    const serverNowMs = new Date(EXPIRES_AT).getTime();

    const state = requestSheetState({
      closedAt: null,
      expiresAt: EXPIRES_AT,
      serverNowMs,
    });

    expect(state).toBe("ended");
  });
});
