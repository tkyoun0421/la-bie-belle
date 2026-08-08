import { describe, expect, it } from "vitest";

import {
  CEREMONY_COUNT_MAX,
  CEREMONY_COUNT_MIN,
  generateCeremonyTimes,
  hasDuplicateCeremonyTime,
  isValidCeremonyCount,
  normalizeTime,
  recommendCheckIn,
  recommendCheckOut,
  sortCeremonyTimes,
  type CheckInRule,
} from "@/entities/schedule/model/ceremony-times";

const SAMPLE_RULES: CheckInRule[] = [
  { firstCeremonyAt: "10:00", recommendedCheckIn: "08:20" },
  { firstCeremonyAt: "11:00", recommendedCheckIn: "09:10" },
];

describe("generateCeremonyTimes", () => {
  it("1시간 간격으로 개수만큼 생성한다", () => {
    expect(generateCeremonyTimes(3, "11:00")).toEqual(["11:00", "12:00", "13:00"]);
  });

  it("개수 1개는 첫 시각 그대로 반환한다", () => {
    expect(generateCeremonyTimes(1, "10:30")).toEqual(["10:30"]);
  });

  it("자정을 넘는 생성은 다음날로 감싸지 않고 null을 반환한다", () => {
    expect(generateCeremonyTimes(2, "23:30")).toBeNull();
  });

  it("경계값: 마지막 예식이 정확히 23:59면 생성을 허용한다", () => {
    expect(generateCeremonyTimes(1, "23:59")).toEqual(["23:59"]);
  });

  it("경계값: 마지막 예식이 자정(24:00)에 걸치면 null을 반환한다", () => {
    expect(generateCeremonyTimes(2, "23:00")).toBeNull();
  });
});

describe("sortCeremonyTimes", () => {
  it("뒤섞인 시각을 시각순으로 재정렬한다", () => {
    expect(sortCeremonyTimes(["12:10", "10:00", "11:00"])).toEqual(["10:00", "11:00", "12:10"]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const original = ["12:00", "10:00"];
    sortCeremonyTimes(original);
    expect(original).toEqual(["12:00", "10:00"]);
  });
});

describe("hasDuplicateCeremonyTime", () => {
  it("같은 시각이 있으면 true를 반환한다", () => {
    expect(hasDuplicateCeremonyTime(["10:00", "11:00", "10:00"])).toBe(true);
  });

  it("모두 다른 시각이면 false를 반환한다", () => {
    expect(hasDuplicateCeremonyTime(["10:00", "11:00"])).toBe(false);
  });
});

describe("isValidCeremonyCount", () => {
  it(`경계값 ${CEREMONY_COUNT_MIN}·${CEREMONY_COUNT_MAX}는 유효하다`, () => {
    expect(isValidCeremonyCount(CEREMONY_COUNT_MIN)).toBe(true);
    expect(isValidCeremonyCount(CEREMONY_COUNT_MAX)).toBe(true);
  });

  it("0개와 13개는 무효하다", () => {
    expect(isValidCeremonyCount(0)).toBe(false);
    expect(isValidCeremonyCount(13)).toBe(false);
  });

  it("정수가 아니면 무효하다", () => {
    expect(isValidCeremonyCount(1.5)).toBe(false);
  });
});

describe("recommendCheckIn", () => {
  it.each([
    ["10:00", "08:20"],
    ["10:30", "08:50"],
    ["11:00", "09:10"],
    ["12:00", "10:10"],
    ["09:00", "07:20"],
  ])("첫 예식 %s는 %s를 추천한다(버림 규칙)", (firstCeremonyTime, expected) => {
    expect(recommendCheckIn(SAMPLE_RULES, firstCeremonyTime)).toBe(expected);
  });

  it("규칙표가 비어 있으면 null을 반환한다", () => {
    expect(recommendCheckIn([], "10:00")).toBeNull();
  });
});

describe("recommendCheckOut", () => {
  it("마지막 예식 2시간 후를 추천한다", () => {
    expect(recommendCheckOut("11:00")).toEqual({ time: "13:00", capped: false });
  });

  it("경계값: 정확히 자정 직전까지는 캡되지 않는다", () => {
    expect(recommendCheckOut("21:59")).toEqual({ time: "23:59", capped: false });
  });

  it("경계값: 자정을 넘기면 23:59로 캡한다", () => {
    expect(recommendCheckOut("22:00")).toEqual({ time: "23:59", capped: true });
  });

  it("자정을 크게 넘겨도 23:59로 캡한다", () => {
    expect(recommendCheckOut("23:30")).toEqual({ time: "23:59", capped: true });
  });
});

describe("normalizeTime", () => {
  it("초 단위를 제거하고 분 단위로 정규화한다", () => {
    expect(normalizeTime("08:20:00")).toBe("08:20");
  });

  it("이미 분 단위인 값은 그대로 유지한다", () => {
    expect(normalizeTime("08:20")).toBe("08:20");
  });
});
