import {
  clockOf,
  kstClockOf,
  kstDateOf,
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

describe("clockOf — 칸에 들어가는 시각은 초를 떼고 분까지다", () => {
  it("초가 붙은 시각에서 초를 뗀다", () => {
    expect(clockOf("10:00:00")).toBe("10:00");
  });

  it("이미 분까지인 시각은 그대로 둔다", () => {
    expect(clockOf("18:30")).toBe("18:30");
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

describe("kstClockOf — 그 순간을 홀의 시계로 읽는다", () => {
  it("UTC 05:30은 KST 14:30이다", () => {
    expect(kstClockOf("2026-10-02T05:30:00Z")).toBe("14:30");
  });

  it("자정을 넘는 시각도 24시가 아니라 00시다", () => {
    expect(kstClockOf("2026-10-02T15:00:00Z")).toBe("00:00");
  });

  it("Date를 그대로 받는다", () => {
    expect(kstClockOf(new Date("2026-10-02T05:30:00Z"))).toBe("14:30");
  });
});
