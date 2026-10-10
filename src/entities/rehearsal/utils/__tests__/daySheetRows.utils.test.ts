import { daySheetRows } from "@/entities/rehearsal/utils/daySheetRows.utils";

const TIME_ROW = {
  id: "row-1",
  startsAt: "14:00",
  endsAt: "16:00",
  count: null,
  name: null,
};

const ZERO_ROW = {
  id: "row-3",
  startsAt: "10:00",
  endsAt: "10:00",
  count: null,
  name: null,
};

const COUNT_ROW = {
  id: "row-2",
  startsAt: null,
  endsAt: null,
  count: 2,
  name: "박서연",
};

describe("daySheetRows — 빈 날은 본인용과 관리자용 문구가 갈린다", () => {
  it("본인이 보는 빈 날은 「이 날 넣은 리허설이 없어요」다", () => {
    expect(daySheetRows([], false)).toEqual({
      kind: "empty",
      message: "이 날 넣은 리허설이 없어요",
    });
  });

  it("관리자가 보는 빈 날은 「이 날 넣은 사람이 없어요」다", () => {
    expect(daySheetRows([], true)).toEqual({
      kind: "empty",
      message: "이 날 넣은 사람이 없어요",
    });
  });
});

describe("daySheetRows — 시각 줄은 「14:00–16:00 · 2시간」이다", () => {
  it("시각 갈래 한 줄의 문구를 만든다", () => {
    const result = daySheetRows([TIME_ROW], false);

    expect(result.kind).toBe("rows");
    if (result.kind === "rows") {
      expect(result.lines).toEqual([
        { id: "row-1", text: "14:00–16:00 · 2시간" },
      ]);
    }
  });
});

describe("daySheetRows — 건수 줄은 「리허설 2건 · 2시간」이다", () => {
  it("건수 갈래 한 줄의 문구를 만든다", () => {
    const result = daySheetRows([COUNT_ROW], false);

    expect(result.kind).toBe("rows");
    if (result.kind === "rows") {
      expect(result.lines).toEqual([
        { id: "row-2", text: "리허설 2건 · 2시간" },
      ]);
    }
  });
});

describe("daySheetRows — 관리자가 볼 때는 이름이 앞에 붙는다", () => {
  it("「박서연 · 리허설 2건 · 2시간」이다", () => {
    const result = daySheetRows([COUNT_ROW], true);

    expect(result.kind).toBe("rows");
    if (result.kind === "rows") {
      expect(result.lines).toEqual([
        { id: "row-2", text: "박서연 · 리허설 2건 · 2시간" },
      ]);
    }
  });
});

describe("daySheetRows — 합계 줄은 줄이 둘 이상일 때만 선다", () => {
  it("줄이 하나면 합계가 없다", () => {
    const result = daySheetRows([TIME_ROW], false);

    expect(result.kind).toBe("rows");
    if (result.kind === "rows") {
      expect(result.totalLine).toBeNull();
    }
  });

  it("줄이 둘이면 「합계 · 4시간」이 선다", () => {
    const result = daySheetRows([TIME_ROW, TIME_ROW], false);

    expect(result.kind).toBe("rows");
    if (result.kind === "rows") {
      expect(result.totalLine).toBe("합계 · 4시간");
    }
  });
});

describe("daySheetRows — 길이가 0분인 줄은 「0시간」이다", () => {
  it("줄 하나는 「10:00–10:00 · 0시간」이다 — 「0분」으로 쓰지 않는다", () => {
    const result = daySheetRows([ZERO_ROW], false);

    expect(result.kind).toBe("rows");
    if (result.kind === "rows") {
      expect(result.lines).toEqual([
        { id: "row-3", text: "10:00–10:00 · 0시간" },
      ]);
    }
  });

  it("0분짜리 줄만 둘이면 합계가 「합계 · 0시간」이다", () => {
    const result = daySheetRows([ZERO_ROW, ZERO_ROW], false);

    expect(result.kind).toBe("rows");
    if (result.kind === "rows") {
      expect(result.totalLine).toBe("합계 · 0시간");
    }
  });
});
