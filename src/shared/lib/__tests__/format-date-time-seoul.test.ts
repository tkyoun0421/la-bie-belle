import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDateTimeInSeoul } from "@/shared/lib/format-date-time-seoul";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("formatDateTimeInSeoul", () => {
  it("KST 오프셋이 있는 ISO 문자열을 YYYY.MM.DD HH:mm으로 포맷한다", () => {
    expect(formatDateTimeInSeoul("2026-08-09T08:58:03+09:00")).toBe("2026.08.09 08:58");
  });

  it.each(["UTC", "Asia/Seoul", "America/New_York"])(
    "실행 환경 타임존(%s)이 달라도 같은 결과를 낸다",
    (tz) => {
      vi.stubEnv("TZ", tz);
      expect(formatDateTimeInSeoul("2026-08-09T08:58:03+09:00")).toBe("2026.08.09 08:58");
    },
  );

  it("KST 자정 전후로 UTC 날짜가 바뀌는 경계에서도 KST 기준 날짜를 보여준다", () => {
    vi.stubEnv("TZ", "UTC");
    expect(formatDateTimeInSeoul("2026-08-08T23:58:03Z")).toBe("2026.08.09 08:58");
  });

  it("Date 인스턴스 입력도 허용한다", () => {
    expect(formatDateTimeInSeoul(new Date("2026-08-09T08:58:03+09:00"))).toBe("2026.08.09 08:58");
  });
});
