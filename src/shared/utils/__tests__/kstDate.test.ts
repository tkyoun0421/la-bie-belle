// 구현 대상: src/shared/utils/kstDate.ts
//
// KST 날짜 손 공용화(plan AC-09) — 슬라이스 넷(schedule-worker·schedule-admin·admin-home·
// applications)에 각자 서 있던 kstDateOf·kstToday·shiftMonth·spellMonth·lastDateOfMonth·
// spellDate를 여기 하나로 모으고 monthOf를 새로 더한다. KST 자정 경계는 UTC 15:00이 당일
// 0시라 14:59Z는 전날, 15:00Z는 당일이다 — schedule-admin/model/format-schedule-date.ts의
// confirmedLine 테스트가 쓰는 것과 같은 경계다.

import {
  kstDateOf,
  kstToday,
  lastDateOfMonth,
  monthOf,
  shiftMonth,
  spellDate,
  spellMonth,
} from "@/shared/utils/kstDate";

describe("kstDateOf — KST 자정 경계로 날짜를 가른다", () => {
  it("UTC 14:59는 아직 전날이다", () => {
    expect(kstDateOf("2026-10-02T14:59:00Z")).toBe("2026-10-02");
  });

  it("UTC 15:00은 이미 다음날이다", () => {
    expect(kstDateOf("2026-10-02T15:00:00Z")).toBe("2026-10-03");
  });

  it("Date 인스턴스를 받아도 같은 경계로 읽는다", () => {
    expect(kstDateOf(new Date("2026-10-02T15:00:00Z"))).toBe("2026-10-03");
  });
});

describe("kstToday — 기기 시간대와 무관하게 KST 자정 경계로 오늘을 읽는다", () => {
  it("UTC 14:59는 아직 전날이다", () => {
    expect(kstToday(new Date("2026-10-02T14:59:00Z"))).toBe("2026-10-02");
  });

  it("UTC 15:00은 이미 다음날이다", () => {
    expect(kstToday(new Date("2026-10-02T15:00:00Z"))).toBe("2026-10-03");
  });
});

describe("monthOf — 날짜에서 그 달을 뗀다", () => {
  it("2026-10-10의 달은 2026-10이다", () => {
    expect(monthOf("2026-10-10")).toBe("2026-10");
  });
});

describe("shiftMonth — 12월과 1월 경계를 해가 바뀌며 넘는다", () => {
  it("12월에서 한 달 앞으로 가면 다음 해 1월이다", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("1월에서 한 달 뒤로 가면 전 해 12월이다", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("같은 해 안에서는 달만 움직인다", () => {
    expect(shiftMonth("2026-05", 1)).toBe("2026-06");
  });
});

describe("spellMonth — 앱바 제목 꼴이다", () => {
  it("2026-10은 「2026년 10월」이다", () => {
    expect(spellMonth("2026-10")).toBe("2026년 10월");
  });
});

describe("lastDateOfMonth — 그 달의 마지막 날이다", () => {
  it("31일까지 있는 달은 31일이다", () => {
    expect(lastDateOfMonth("2026-10")).toBe("2026-10-31");
  });

  it("평년 2월은 28일이다", () => {
    expect(lastDateOfMonth("2026-02")).toBe("2026-02-28");
  });

  it("윤년 2월은 29일이다", () => {
    expect(lastDateOfMonth("2028-02")).toBe("2028-02-29");
  });
});

describe("spellDate — 요일 한 글자를 붙인다", () => {
  it("2026-10-10은 「10월 10일(토)」다", () => {
    expect(spellDate("2026-10-10")).toBe("10월 10일(토)");
  });
});
