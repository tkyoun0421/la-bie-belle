import { describe, expect, it } from "vitest";

import { isSystemPosition, mapPositionRow } from "@/entities/position/model/position";

describe("mapPositionRow", () => {
  it("snake_case DB 행을 camelCase Position DTO로 매핑한다", () => {
    const result = mapPositionRow({
      id: "position-1",
      name: "팀장",
      code: "team_lead",
      default_required_count: 1,
      gender_requirement: "any",
      is_default: false,
      is_active: true,
    });

    expect(result).toEqual({
      id: "position-1",
      name: "팀장",
      code: "team_lead",
      defaultRequiredCount: 1,
      genderRequirement: "any",
      isDefault: false,
      isActive: true,
    });
  });

  it("gender_requirement이 스키마 값 집합 밖이면 파싱을 거부한다", () => {
    expect(() =>
      mapPositionRow({
        id: "position-2",
        name: "드레스",
        code: null,
        default_required_count: 1,
        gender_requirement: "unknown",
        is_default: false,
        is_active: true,
      }),
    ).toThrow();
  });
});

describe("isSystemPosition", () => {
  it("code가 있으면 시스템 포지션이다", () => {
    expect(isSystemPosition({ code: "team_lead" })).toBe(true);
  });

  it("code가 null이면 시스템 포지션이 아니다", () => {
    expect(isSystemPosition({ code: null })).toBe(false);
  });
});
