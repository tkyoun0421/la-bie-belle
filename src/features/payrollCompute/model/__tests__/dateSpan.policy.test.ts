const { isInSpan, monthKeysOf, monthSpan } =
  await import("@/features/payrollCompute/model/dateSpan.policy");

describe("monthKeysOf — 구간이 걸친 달을 빠짐없이 든다", () => {
  it("한 달 안이면 그 달 하나다", () => {
    expect(monthKeysOf({ from: "2026-10-01", to: "2026-10-31" })).toEqual([
      "2026-10",
    ]);
  });

  it("주가 달을 넘으면 두 달이다", () => {
    expect(monthKeysOf({ from: "2026-09-28", to: "2026-10-04" })).toEqual([
      "2026-09",
      "2026-10",
    ]);
  });

  it("연 구간이면 열두 달이 순서대로 선다", () => {
    const months = monthKeysOf({ from: "2026-01-01", to: "2026-12-31" });

    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2026-01");
    expect(months[11]).toBe("2026-12");
  });

  it("해를 넘겨도 이어진다", () => {
    expect(monthKeysOf({ from: "2026-12-28", to: "2027-01-03" })).toEqual([
      "2026-12",
      "2027-01",
    ]);
  });

  it("하루짜리 구간도 그 달 하나다", () => {
    expect(monthKeysOf({ from: "2026-10-09", to: "2026-10-09" })).toEqual([
      "2026-10",
    ]);
  });
});

describe("monthSpan — 달 하나를 구간으로 펼친다", () => {
  it("그 달 1일부터 끝까지다", () => {
    expect(monthSpan("2026-10")).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("펼친 구간이 그 달 하나만 읽는다", () => {
    expect(monthKeysOf(monthSpan("2026-02"))).toEqual(["2026-02"]);
  });

  it("짧은 달의 마지막 날도 안에 든다", () => {
    expect(isInSpan(monthSpan("2026-02"), "2026-02-28")).toBe(true);
    expect(isInSpan(monthSpan("2026-02"), "2026-03-01")).toBe(false);
  });

  it("끝은 실재하는 날짜다 — 짧은 달에 없는 날을 내지 않는다", () => {
    expect(monthSpan("2026-02").to).toBe("2026-02-28");
    expect(monthSpan("2026-04").to).toBe("2026-04-30");
  });

  it("윤년 2월은 29일까지다", () => {
    expect(monthSpan("2028-02").to).toBe("2028-02-29");
  });
});

describe("isInSpan — 양 끝을 포함한다", () => {
  const span = { from: "2026-10-05", to: "2026-10-11" };

  it("첫날과 끝날이 안에 든다", () => {
    expect(isInSpan(span, "2026-10-05")).toBe(true);
    expect(isInSpan(span, "2026-10-11")).toBe(true);
  });

  it("하루 전과 하루 뒤는 밖이다", () => {
    expect(isInSpan(span, "2026-10-04")).toBe(false);
    expect(isInSpan(span, "2026-10-12")).toBe(false);
  });
});
