import { afterEach, describe, expect, it, vi } from "vitest";

import {
  mapDormancyRpcErrorCode,
  resolveAutoDepartureDate,
} from "@/entities/identity/model/dormancy";
import { ERROR_CODE } from "@/shared/config/error-codes.config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveAutoDepartureDate", () => {
  it("KST 기준 anchor에 1년을 더한 날짜를 YYYY년 M월 D일로 반환한다", () => {
    expect(resolveAutoDepartureDate("2026-01-15T00:00:00+09:00")).toBe("2027년 1월 15일");
  });

  it("문자열 anchor뿐 아니라 Date 인스턴스도 허용한다", () => {
    expect(resolveAutoDepartureDate(new Date("2026-01-15T00:00:00+09:00"))).toBe("2027년 1월 15일");
  });

  it.each(["UTC", "Asia/Seoul", "America/New_York"])(
    "실행 환경 타임존(%s)이 달라도 같은 결과를 낸다",
    (tz) => {
      vi.stubEnv("TZ", tz);
      expect(resolveAutoDepartureDate("2026-01-15T00:00:00+09:00")).toBe("2027년 1월 15일");
    },
  );

  it("KST 자정 전후로 UTC 날짜가 바뀌는 연말 경계에서도 KST 기준 날짜에 1년을 더한다", () => {
    expect(resolveAutoDepartureDate("2025-12-31T20:00:00Z")).toBe("2027년 1월 1일");
  });

  it("윤년 2월 29일 anchor는 다음 해가 평년이면 3월 1일로 정규화된다", () => {
    expect(resolveAutoDepartureDate("2024-02-29T00:00:00+09:00")).toBe("2025년 3월 1일");
  });
});

describe("mapDormancyRpcErrorCode", () => {
  it("42501은 COMMON_FORBIDDEN으로 매핑한다", () => {
    expect(mapDormancyRpcErrorCode("42501")).toBe(ERROR_CODE.COMMON_FORBIDDEN);
  });

  it.each(["LB010", "LB011"])("%s는 IDENTITY_STATUS_CONFLICT로 매핑한다", (code) => {
    expect(mapDormancyRpcErrorCode(code)).toBe(ERROR_CODE.IDENTITY_STATUS_CONFLICT);
  });

  it("그 외 코드는 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapDormancyRpcErrorCode("57P01")).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });

  it("코드가 없으면 COMMON_UNEXPECTED로 매핑한다", () => {
    expect(mapDormancyRpcErrorCode(undefined)).toBe(ERROR_CODE.COMMON_UNEXPECTED);
  });
});
