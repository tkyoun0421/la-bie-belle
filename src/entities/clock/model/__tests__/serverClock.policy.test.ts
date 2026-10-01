// 구현 대상: src/entities/clock/model/serverClock.ts
//
// 서버 시각 오프셋과 만료 판정의 순수 계산이다(runtime.md 「서버 시각」, plan
// schedule-requests.md 「총괄이 정한 것」 2·3). `serverOffset`이 앱이 뜰 때 한 번 잰
// 차이고, `nowWithOffset`이 화면이 그리는 지금이며, `remainingMs`·`isExpired`가 요청
// 카운트다운과 만료 잠금을 판정한다. 시각은 전부 인자로 받는다 — `Date.now()`를 직접
// 안 부른다.

import {
  isExpired,
  nowWithOffset,
  remainingMs,
  serverOffset,
} from "@/entities/clock/model/serverClock.policy";

describe("serverOffset — 서버 시각과 기기 시각의 차이를 잰다", () => {
  it("서버가 기기보다 앞서 있으면 양수를 낸다", () => {
    const deviceNowMs = new Date("2026-10-10T10:00:00Z").getTime();
    const serverNowIso = "2026-10-10T10:00:05Z";

    expect(serverOffset(serverNowIso, deviceNowMs)).toBe(5_000);
  });

  it("서버가 기기보다 뒤처져 있으면 음수를 낸다", () => {
    const deviceNowMs = new Date("2026-10-10T10:00:05Z").getTime();
    const serverNowIso = "2026-10-10T10:00:00Z";

    expect(serverOffset(serverNowIso, deviceNowMs)).toBe(-5_000);
  });
});

describe("nowWithOffset — 기기 시각에 오프셋을 더한 값이 화면이 쓰는 지금이다", () => {
  it("오프셋만큼 밀린 시각을 낸다", () => {
    expect(nowWithOffset(1_000, 500)).toBe(1_500);
  });

  it("오프셋이 0이면 기기 시각 그대로다", () => {
    expect(nowWithOffset(1_000, 0)).toBe(1_000);
  });
});

describe("remainingMs — 만료까지 남은 밀리초다, 지났으면 0이다", () => {
  it("아직 안 지났으면 남은 밀리초를 낸다", () => {
    const expiresAt = "2026-10-10T12:00:00Z";
    const serverNowMs = new Date("2026-10-10T11:59:00Z").getTime();

    expect(remainingMs(expiresAt, serverNowMs)).toBe(60_000);
  });

  it("이미 지났으면 음수 대신 0을 낸다", () => {
    const expiresAt = "2026-10-10T12:00:00Z";
    const serverNowMs = new Date("2026-10-10T12:05:00Z").getTime();

    expect(remainingMs(expiresAt, serverNowMs)).toBe(0);
  });

  it("정확히 만료 시각이면 0이다", () => {
    const expiresAt = "2026-10-10T12:00:00Z";
    const serverNowMs = new Date(expiresAt).getTime();

    expect(remainingMs(expiresAt, serverNowMs)).toBe(0);
  });
});

describe("isExpired — 만료 시각이 서버 시각과 같거나 지났으면 참이다", () => {
  it("아직 안 지났으면 거짓이다", () => {
    const expiresAt = "2026-10-10T12:00:00Z";
    const serverNowMs = new Date("2026-10-10T11:00:00Z").getTime();

    expect(isExpired(expiresAt, serverNowMs)).toBe(false);
  });

  it("지났으면 참이다", () => {
    const expiresAt = "2026-10-10T12:00:00Z";
    const serverNowMs = new Date("2026-10-10T13:00:00Z").getTime();

    expect(isExpired(expiresAt, serverNowMs)).toBe(true);
  });

  it("정확히 만료 시각이면 참이다 — 경계는 만료 쪽이다", () => {
    const expiresAt = "2026-10-10T12:00:00Z";
    const serverNowMs = new Date(expiresAt).getTime();

    expect(isExpired(expiresAt, serverNowMs)).toBe(true);
  });
});
