import { describe, expect, it } from "vitest";

import { toFullDateLabel, toShortDateLabel } from "@/views/home/model/date-labels";

describe("toFullDateLabel — 라운드 8·34, 오늘 블록 제목은 로딩 중에도 남는 값이라 model이 낸다", () => {
  it("월·일과 전체 요일을 낸다 — 형식은 시안의 「8월 18일 월요일」과 같되, 실제 2026-08-18은 화요일이라(라운드 28) 요일은 실제 달력을 따른다", () => {
    expect(toFullDateLabel("2026-08-18")).toBe("8월 18일 화요일");
  });

  it("요일이 바뀌면 그 요일 그대로 낸다", () => {
    expect(toFullDateLabel("2026-08-23")).toBe("8월 23일 일요일");
  });

  it("한 자리 날짜에 0을 안 붙인다", () => {
    expect(toFullDateLabel("2026-09-05")).toBe("9월 5일 토요일");
  });
});

describe("toShortDateLabel — 라운드 22, 다가오는 근무 행의 날짜는 축약 요일이다", () => {
  it("월·일과 한 글자 요일을 낸다 — 형식은 시안의 「8월 19일 화」와 같되, 실제 달력에서 8월 19일은 수요일이라(라운드 28) 요일은 실제 달력을 따른다", () => {
    expect(toShortDateLabel("2026-08-19")).toBe("8월 19일 수");
  });

  it("week-strip.ts의 weekdayLabel과 같은 한 글자 어휘를 쓴다", () => {
    expect(toShortDateLabel("2026-08-17")).toBe("8월 17일 월");
    expect(toShortDateLabel("2026-08-23")).toBe("8월 23일 일");
  });

  it("한 자리 날짜에 0을 안 붙인다", () => {
    expect(toShortDateLabel("2026-09-05")).toBe("9월 5일 토");
  });

  it("전체 요일 이름을 쓰지 않는다 — 축약과 전체는 다른 함수다", () => {
    expect(toShortDateLabel("2026-08-19")).not.toContain("요일");
  });
});
