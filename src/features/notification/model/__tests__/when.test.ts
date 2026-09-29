// @ts-expect-error 대상 모듈이 아직 없다
const { toNotificationDateHeader, toNotificationReceivedTime } =
  await import("@/features/notification/model/when");

const NOW = new Date("2025-09-13T22:00:00+09:00");

describe("toNotificationDateHeader — 받은 날이 오늘이면 '오늘'이다", () => {
  it("같은 날 아침에 받았으면 '오늘'이다", () => {
    const receivedAt = "2025-09-13T08:00:00+09:00";

    expect(toNotificationDateHeader(receivedAt, NOW)).toBe("오늘");
  });
});

describe("toNotificationDateHeader — 받은 날이 어제면 '어제'다", () => {
  it("하루 전 저녁에 받았으면 '어제'다", () => {
    const receivedAt = "2025-09-12T21:00:00+09:00";

    expect(toNotificationDateHeader(receivedAt, NOW)).toBe("어제");
  });
});

describe("toNotificationDateHeader — 그저께부터는 날짜와 요일이다", () => {
  it("이틀 전이면 '9월 11일(목)'이다", () => {
    const receivedAt = "2025-09-11T10:00:00+09:00";

    expect(toNotificationDateHeader(receivedAt, NOW)).toBe("9월 11일(목)");
  });
});

describe("toNotificationDateHeader — 해가 다르면 연도가 붙는다", () => {
  it("작년 마지막 날이면 '2025년 12월 31일(수)'다", () => {
    const receivedAt = "2025-12-31T10:00:00+09:00";
    const now = new Date("2026-01-03T10:00:00+09:00");

    expect(toNotificationDateHeader(receivedAt, now)).toBe(
      "2025년 12월 31일(수)",
    );
  });
});

describe("toNotificationDateHeader — 자정을 넘기면 '오늘'이 아니라 '어제'로 갈린다", () => {
  it("20분 전이어도 자정을 건넜으면 '어제'다", () => {
    const now = new Date("2025-09-13T00:10:00+09:00");
    const receivedAt = "2025-09-12T23:50:00+09:00";

    expect(toNotificationDateHeader(receivedAt, now)).toBe("어제");
  });
});

describe("toNotificationReceivedTime — 1분 안이면 '방금'이다", () => {
  it("10초 전이면 '방금'이다", () => {
    const receivedAt = "2025-09-13T21:59:50+09:00";

    expect(toNotificationReceivedTime(receivedAt, NOW)).toBe("방금");
  });
});

describe("toNotificationReceivedTime — 한 시간 안이면 분 단위다", () => {
  it("12분 전이면 '12분 전'이다", () => {
    const receivedAt = "2025-09-13T21:48:00+09:00";

    expect(toNotificationReceivedTime(receivedAt, NOW)).toBe("12분 전");
  });

  it("59분 전이면 '59분 전'이다 — 시간 단위로 안 올라간다", () => {
    const receivedAt = "2025-09-13T21:01:00+09:00";

    expect(toNotificationReceivedTime(receivedAt, NOW)).toBe("59분 전");
  });
});

describe("toNotificationReceivedTime — 한 시간이 넘으면 시간 단위다", () => {
  it("61분 전이면 '1시간 전'이다 — 분에서 시간 단위로 넘어간다", () => {
    const receivedAt = "2025-09-13T20:59:00+09:00";

    expect(toNotificationReceivedTime(receivedAt, NOW)).toBe("1시간 전");
  });

  it("2시간 전이면 '2시간 전'이다", () => {
    const receivedAt = "2025-09-13T20:00:00+09:00";

    expect(toNotificationReceivedTime(receivedAt, NOW)).toBe("2시간 전");
  });
});

describe("toNotificationReceivedTime — 어제 받은 것은 시각으로 적는다", () => {
  it("어제 21:00에 받았으면 '어제 21:00'이다", () => {
    const receivedAt = "2025-09-12T21:00:00+09:00";

    expect(toNotificationReceivedTime(receivedAt, NOW)).toBe("어제 21:00");
  });

  it("어제 14:20에 받았으면 '어제 14:20'이다", () => {
    const receivedAt = "2025-09-12T14:20:00+09:00";

    expect(toNotificationReceivedTime(receivedAt, NOW)).toBe("어제 14:20");
  });
});

describe("toNotificationReceivedTime — 그저께부터는 날짜만 적고 요일은 안 붙인다", () => {
  it("이틀 전이면 '9월 11일'이다", () => {
    const receivedAt = "2025-09-11T10:00:00+09:00";

    expect(toNotificationReceivedTime(receivedAt, NOW)).toBe("9월 11일");
  });
});

describe("toNotificationReceivedTime — 자정을 넘기면 분 단위가 아니라 '어제 시각'이다", () => {
  it("20분 전이어도 자정을 건넜으면 '어제 23:50'이다", () => {
    const now = new Date("2025-09-13T00:10:00+09:00");
    const receivedAt = "2025-09-12T23:50:00+09:00";

    expect(toNotificationReceivedTime(receivedAt, now)).toBe("어제 23:50");
  });
});
