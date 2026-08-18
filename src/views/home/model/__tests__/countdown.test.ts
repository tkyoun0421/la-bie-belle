import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatCountdownClock,
  formatWindowOpensAt,
  toCountdown,
} from "@/views/home/model/countdown";
import type { CountdownState } from "@/views/home/model/countdown";
import type { AttendanceWindow } from "@/views/home/model/home-view-model";

afterEach(() => {
  vi.unstubAllEnvs();
});

const CHECK_IN_WINDOW: AttendanceWindow = {
  action: "check-in",
  scheduledAt: "2026-08-18T09:00:00+09:00",
};

const CHECK_OUT_WINDOW: AttendanceWindow = {
  action: "check-out",
  scheduledAt: "2026-08-18T18:00:00+09:00",
};

describe("toCountdown — PRD.md:298-300, 출근 2시간 전 · 퇴근 1시간 전부터 창이 열린다", () => {
  it("출근 창이 열리기 전에는 열릴 때까지 남은 초를 낸다", () => {
    const state = toCountdown(CHECK_IN_WINDOW, new Date("2026-08-18T05:00:00+09:00"));

    expect(state.phase).toBe("before-window");
    expect(state).toMatchObject({ phase: "before-window", remainingSeconds: 7200 });
  });

  it("예정 출근 2시간 전 정각에 창이 열린다", () => {
    const state = toCountdown(CHECK_IN_WINDOW, new Date("2026-08-18T07:00:00+09:00"));

    expect(state).toMatchObject({ phase: "open", remainingSeconds: 7200 });
  });

  it("창이 열린 뒤에는 예정 출근 시각까지 남은 초를 낸다", () => {
    const state = toCountdown(CHECK_IN_WINDOW, new Date("2026-08-18T08:30:00+09:00"));

    expect(state).toMatchObject({ phase: "open", remainingSeconds: 1800 });
  });

  it("예정 출근 시각 정각은 초과로 뒤집힌다 — 경과 0초", () => {
    const state = toCountdown(CHECK_IN_WINDOW, new Date("2026-08-18T09:00:00+09:00"));

    expect(state).toMatchObject({ phase: "overdue", elapsedSeconds: 0 });
  });

  it("예정 시각을 지나면 경과 시간을 세어 올린다 — 시안의 +0:12:04", () => {
    const state = toCountdown(CHECK_IN_WINDOW, new Date("2026-08-18T09:12:04+09:00"));

    expect(state).toMatchObject({ phase: "overdue", elapsedSeconds: 724 });
  });

  it("늦어도 인증은 된다 — 초과는 오류가 아니라 세 상태 중 하나일 뿐이다", () => {
    const state = toCountdown(CHECK_IN_WINDOW, new Date("2026-08-19T00:00:00+09:00"));

    expect(["before-window", "open", "overdue"]).toContain(state.phase);
    expect(state).not.toHaveProperty("error");
    expect(state).not.toHaveProperty("failed");
  });

  it("퇴근 창은 예정 퇴근 1시간 전부터 열린다 — 열리기 전", () => {
    const state = toCountdown(CHECK_OUT_WINDOW, new Date("2026-08-18T16:00:00+09:00"));

    expect(state).toMatchObject({ phase: "before-window", remainingSeconds: 3600 });
  });

  it("퇴근 창이 열린 뒤에는 예정 퇴근 시각까지 남은 초를 낸다", () => {
    const state = toCountdown(CHECK_OUT_WINDOW, new Date("2026-08-18T17:30:00+09:00"));

    expect(state).toMatchObject({ phase: "open", remainingSeconds: 1800 });
  });

  it("두 액션은 같은 예정 시각이어도 창이 열리는 시점이 다르다(2시간 vs 1시간)", () => {
    const sameScheduled = "2026-08-18T20:00:00+09:00";
    const now = new Date("2026-08-18T18:30:00+09:00");

    const checkIn = toCountdown({ action: "check-in", scheduledAt: sameScheduled }, now);
    const checkOut = toCountdown({ action: "check-out", scheduledAt: sameScheduled }, now);

    expect(checkIn.phase).toBe("open");
    expect(checkOut.phase).toBe("before-window");
  });
});

describe("formatCountdownClock — 라운드 8, no-logic-in-ui가 나눗셈·나머지를 막아 시계 문자열은 model이 낸다", () => {
  it("한 시간이 넘으면 시:분:초를 낸다 — 시안의 1:18:59", () => {
    const state: CountdownState = { phase: "open", remainingSeconds: 4739 };

    expect(formatCountdownClock(state)).toBe("1:18:59");
  });

  it("한 시간 미만은 시 없이 분:초만 낸다", () => {
    const state: CountdownState = { phase: "before-window", remainingSeconds: 1478 };

    expect(formatCountdownClock(state)).toBe("24:38");
  });

  it("한 자리 분·초는 분은 안 채우고 초만 두 자리로 채운다", () => {
    const state: CountdownState = { phase: "open", remainingSeconds: 65 };

    expect(formatCountdownClock(state)).toBe("1:05");
  });

  it("초과는 앞에 +를 붙이고, 한 시간 미만이어도 시 자리를 0으로 남긴다 — 시안의 +0:12:04", () => {
    const state: CountdownState = { phase: "overdue", elapsedSeconds: 724 };

    expect(formatCountdownClock(state)).toBe("+0:12:04");
  });

  it("초과가 한 시간을 넘으면 시:분:초에 +만 더한다", () => {
    const state: CountdownState = { phase: "overdue", elapsedSeconds: 4739 };

    expect(formatCountdownClock(state)).toBe("+1:18:59");
  });

  it("초과 0초는 +0:00:00이다", () => {
    const state: CountdownState = { phase: "overdue", elapsedSeconds: 0 };

    expect(formatCountdownClock(state)).toBe("+0:00:00");
  });
});

describe("formatWindowOpensAt — 시안의 09:00부터 인증 가능, 창이 열리는 절대 시각을 서울 기준으로 낸다", () => {
  it("예정 출근 11:00에서 리드 2시간을 빼면 09:00이다", () => {
    const window: AttendanceWindow = {
      action: "check-in",
      scheduledAt: "2026-08-18T11:00:00+09:00",
    };

    expect(formatWindowOpensAt(window)).toBe("09:00");
  });

  it("예정 퇴근 18:00에서 리드 1시간을 빼면 17:00이다", () => {
    const window: AttendanceWindow = {
      action: "check-out",
      scheduledAt: "2026-08-18T18:00:00+09:00",
    };

    expect(formatWindowOpensAt(window)).toBe("17:00");
  });

  it("자정을 넘으면 전날 시각으로 뒤집힌다 — 예정 출근 01:00은 창이 전날 23:00에 연다", () => {
    const window: AttendanceWindow = {
      action: "check-in",
      scheduledAt: "2026-08-18T01:00:00+09:00",
    };

    expect(formatWindowOpensAt(window)).toBe("23:00");
  });

  it("분 단위도 그대로 옮긴다", () => {
    const window: AttendanceWindow = {
      action: "check-in",
      scheduledAt: "2026-08-18T09:05:00+09:00",
    };

    expect(formatWindowOpensAt(window)).toBe("07:05");
  });

  it("시 자리가 0이 되어도 두 자리로 채운다", () => {
    const window: AttendanceWindow = {
      action: "check-in",
      scheduledAt: "2026-08-18T02:00:00+09:00",
    };

    expect(formatWindowOpensAt(window)).toBe("00:00");
  });

  it.each(["UTC", "Asia/Seoul", "America/New_York"])(
    "실행 환경 타임존(%s)이 달라도 서울 기준으로 같은 결과를 낸다 — format-time-seoul.ts 재사용 확인",
    (tz) => {
      vi.stubEnv("TZ", tz);
      const window: AttendanceWindow = {
        action: "check-in",
        scheduledAt: "2026-08-18T11:00:00+09:00",
      };

      expect(formatWindowOpensAt(window)).toBe("09:00");
    },
  );
});
