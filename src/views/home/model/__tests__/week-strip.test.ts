import { afterEach, describe, expect, it, vi } from "vitest";

import { toCurrentWeekLabels, toWeekFooter, toWeekStripCells } from "@/views/home/model/week-strip";

type WeekDayShift = { position: string; hours: number; amount: number };
type WeekDay = { date: string; hasShift: boolean; shift: WeekDayShift | null };

function work(date: string, position: string, hours: number, amount: number): WeekDay {
  return { date, hasShift: true, shift: { position, hours, amount } };
}

function rest(date: string): WeekDay {
  return { date, hasShift: false, shift: null };
}

const THREE_SHIFT_WEEK: readonly WeekDay[] = [
  work("2026-08-17", "홀서빙", 5, 60000),
  rest("2026-08-18"),
  rest("2026-08-19"),
  work("2026-08-20", "접수", 5, 60000),
  rest("2026-08-21"),
  work("2026-08-22", "홀서빙", 5, 60000),
  rest("2026-08-23"),
];

const ONE_SHIFT_WEEK: readonly WeekDay[] = [
  rest("2026-08-17"),
  rest("2026-08-18"),
  rest("2026-08-19"),
  rest("2026-08-20"),
  rest("2026-08-21"),
  rest("2026-08-22"),
  work("2026-08-23", "홀서빙", 5, 60000),
];

const EMPTY_WEEK: readonly WeekDay[] = [
  rest("2026-08-17"),
  rest("2026-08-18"),
  rest("2026-08-19"),
  rest("2026-08-20"),
  rest("2026-08-21"),
  rest("2026-08-22"),
  rest("2026-08-23"),
];

const MONTH_CROSSING_WEEK: readonly WeekDay[] = [
  work("2026-08-31", "홀서빙", 5, 60000),
  work("2026-09-01", "접수", 5, 60000),
  rest("2026-09-02"),
  rest("2026-09-03"),
  rest("2026-09-04"),
  rest("2026-09-05"),
  rest("2026-09-06"),
];

describe("toWeekStripCells — 라운드 16·20, UI가 못 뽑는 요일·날짜 숫자를 model이 낸다", () => {
  it("일곱 칸에 요일 글자와 날짜 숫자를 함께 낸다", () => {
    const cells = toWeekStripCells(THREE_SHIFT_WEEK);

    expect(cells).toHaveLength(7);
    expect(cells[0]).toMatchObject({ date: "2026-08-17", weekdayLabel: "월", dayNumber: 17 });
    expect(cells[1]).toMatchObject({ date: "2026-08-18", weekdayLabel: "화", dayNumber: 18 });
    expect(cells[6]).toMatchObject({ date: "2026-08-23", weekdayLabel: "일", dayNumber: 23 });
  });

  it("근무 여부를 그대로 옮긴다", () => {
    const cells = toWeekStripCells(THREE_SHIFT_WEEK);

    expect(cells.map((cell) => cell.hasShift)).toEqual([
      true,
      false,
      false,
      true,
      false,
      true,
      false,
    ]);
  });

  it("달을 넘는 주에서도 각 칸이 자기 날짜의 요일을 낸다 — 8/31이 9월 첫 주에 든다", () => {
    const cells = toWeekStripCells(MONTH_CROSSING_WEEK);

    expect(cells[0]).toMatchObject({ date: "2026-08-31", weekdayLabel: "월", dayNumber: 31 });
    expect(cells[1]).toMatchObject({ date: "2026-09-01", weekdayLabel: "화", dayNumber: 1 });
  });
});

describe("toWeekFooter — 라운드 21·30·32, 발치는 주 요약과 그날 정보 사이를 오간다", () => {
  it("선택 없이는 주급과 근무 횟수·시간을 합쳐 낸다", () => {
    const footer = toWeekFooter({ days: THREE_SHIFT_WEEK }, null);

    expect(footer).toEqual({ caption: "주급 · 3회 15시간", amount: 180000 });
  });

  it("근무가 하나뿐이어도 같은 문장 규칙을 따른다", () => {
    const footer = toWeekFooter({ days: ONE_SHIFT_WEEK }, null);

    expect(footer).toEqual({ caption: "주급 · 1회 5시간", amount: 60000 });
  });

  it("빈 주는 0원이 아니라 문장과 없음이다", () => {
    const footer = toWeekFooter({ days: EMPTY_WEEK }, null);

    expect(footer).toEqual({ caption: "이번 주 근무가 없어요", amount: null });
  });

  it("근무 있는 날을 선택하면 그날 정보로 바뀐다 — 날짜·요일·포지션·시간", () => {
    const footer = toWeekFooter({ days: THREE_SHIFT_WEEK }, "2026-08-20");

    expect(footer).toEqual({ caption: "8월 20일 목 · 접수 5시간", amount: 60000 });
  });

  it("다른 날을 선택하면 발치가 그 날짜로 바로 바뀐다", () => {
    const footer = toWeekFooter({ days: THREE_SHIFT_WEEK }, "2026-08-22");

    expect(footer).toEqual({ caption: "8월 22일 토 · 홀서빙 5시간", amount: 60000 });
  });

  it("선택이 달을 넘겨도 그날의 실제 달로 캡션을 낸다", () => {
    const footer = toWeekFooter({ days: MONTH_CROSSING_WEEK }, "2026-09-01");

    expect(footer).toEqual({ caption: "9월 1일 화 · 접수 5시간", amount: 60000 });
  });

  it("선택을 풀면(null) 다시 주 요약으로 돌아온다", () => {
    const selected = toWeekFooter({ days: THREE_SHIFT_WEEK }, "2026-08-20");
    const cleared = toWeekFooter({ days: THREE_SHIFT_WEEK }, null);

    expect(selected.caption).not.toBe(cleared.caption);
    expect(cleared).toEqual({ caption: "주급 · 3회 15시간", amount: 180000 });
  });

  it("근무 없는 날이 선택값으로 들어와도 방어적으로 주 요약을 낸다", () => {
    const footer = toWeekFooter({ days: THREE_SHIFT_WEEK }, "2026-08-18");

    expect(footer).toEqual({ caption: "주급 · 3회 15시간", amount: 180000 });
  });
});

describe("toCurrentWeekLabels — 인수 조건 8·39, BlockSkeleton이 아는 값을 가리지 않으려면 원재료가 필요하다", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("오늘이 속한 주를 월요일부터 일요일까지 일곱 칸으로 낸다 — 화요일 2026-08-18 기준", () => {
    const labels = toCurrentWeekLabels("2026-08-18");

    expect(labels).toEqual([
      { weekdayLabel: "월", dayNumber: 17 },
      { weekdayLabel: "화", dayNumber: 18 },
      { weekdayLabel: "수", dayNumber: 19 },
      { weekdayLabel: "목", dayNumber: 20 },
      { weekdayLabel: "금", dayNumber: 21 },
      { weekdayLabel: "토", dayNumber: 22 },
      { weekdayLabel: "일", dayNumber: 23 },
    ]);
  });

  it("일요일이 오늘이어도 그 주의 월요일부터 시작한다 — notification-group.ts의 일요일 시작과 다르다", () => {
    const labels = toCurrentWeekLabels("2026-08-23");

    expect(labels[0]).toEqual({ weekdayLabel: "월", dayNumber: 17 });
    expect(labels[6]).toEqual({ weekdayLabel: "일", dayNumber: 23 });
  });

  it("달을 넘는 주에서도 각 칸이 자기 날짜의 요일·날짜를 낸다 — 8/31이 9월 첫 주에 든다", () => {
    const labels = toCurrentWeekLabels("2026-09-03");

    expect(labels[0]).toEqual({ weekdayLabel: "월", dayNumber: 31 });
    expect(labels[1]).toEqual({ weekdayLabel: "화", dayNumber: 1 });
    expect(labels[6]).toEqual({ weekdayLabel: "일", dayNumber: 6 });
  });

  it("해를 넘는 주에서도 각 칸이 자기 날짜의 요일·날짜를 낸다 — 12/28이 다음 해 첫 주로 이어진다", () => {
    const labels = toCurrentWeekLabels("2026-12-30");

    expect(labels[0]).toEqual({ weekdayLabel: "월", dayNumber: 28 });
    expect(labels[6]).toEqual({ weekdayLabel: "일", dayNumber: 3 });
  });

  it.each(["UTC", "Asia/Seoul", "America/New_York"])(
    "실행 환경 타임존(%s)이 달라도 같은 결과를 낸다 — Z를 벽시계로 오해한 과거 9시간 오차의 재발을 막는다",
    (tz) => {
      vi.stubEnv("TZ", tz);

      const labels = toCurrentWeekLabels("2026-08-18");

      expect(labels[0]).toEqual({ weekdayLabel: "월", dayNumber: 17 });
      expect(labels[6]).toEqual({ weekdayLabel: "일", dayNumber: 23 });
    },
  );
});
