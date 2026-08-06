import { afterEach, describe, expect, it, vi } from "vitest";

import { formatTimeInSeoul } from "@/shared/lib/format-time-seoul";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("formatTimeInSeoul", () => {
  it("KST 오프셋이 있는 ISO 문자열을 HH:mm으로 포맷한다", () => {
    expect(formatTimeInSeoul("2026-08-09T08:58:03+09:00")).toBe("08:58");
  });

  it.each(["UTC", "Asia/Seoul", "America/New_York"])(
    "실행 환경 타임존(%s)이 달라도 같은 결과를 낸다",
    (tz) => {
      vi.stubEnv("TZ", tz);
      expect(formatTimeInSeoul("2026-08-09T08:58:03+09:00")).toBe("08:58");
    },
  );

  it("자정을 넘긴 시각을 00시대로 표시한다(24시로 넘기지 않는다)", () => {
    expect(formatTimeInSeoul("2026-08-09T00:05:00+09:00")).toBe("00:05");
  });

  it("KST 자정 전후로 UTC 날짜가 바뀌는 경계에서도 KST 기준 시각을 보여준다", () => {
    vi.stubEnv("TZ", "UTC");
    expect(formatTimeInSeoul("2026-08-08T23:58:03Z")).toBe("08:58");
  });

  it("Date 인스턴스 입력도 허용한다", () => {
    expect(formatTimeInSeoul(new Date("2026-08-09T08:58:03+09:00"))).toBe("08:58");
  });
});
