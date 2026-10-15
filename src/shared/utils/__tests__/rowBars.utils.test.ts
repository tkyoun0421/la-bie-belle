describe("barWidths — 가장 큰 값을 100%로 놓고 나머지를 비율로 낸다", () => {
  it("30과 60이면 50%와 100%다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { barWidths } = await import("@/shared/utils/rowBars.utils");

    expect(barWidths([30, 60])).toEqual(["50%", "100%"]);
  });

  it("1과 4면 25%와 100%다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { barWidths } = await import("@/shared/utils/rowBars.utils");

    expect(barWidths([1, 4])).toEqual(["25%", "100%"]);
  });

  it("값이 하나면 그 값이 100%다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { barWidths } = await import("@/shared/utils/rowBars.utils");

    expect(barWidths([7])).toEqual(["100%"]);
  });
});

describe("barWidths — 0 이하는 막대가 없다", () => {
  it("0인 줄은 null이고 나머지 기준은 그대로다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { barWidths } = await import("@/shared/utils/rowBars.utils");

    expect(barWidths([0, 40])).toEqual([null, "100%"]);
  });

  it("전부 0이면 전부 null이다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { barWidths } = await import("@/shared/utils/rowBars.utils");

    expect(barWidths([0, 0])).toEqual([null, null]);
  });

  it("음수는 null이다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { barWidths } = await import("@/shared/utils/rowBars.utils");

    expect(barWidths([-5, 10])).toEqual([null, "100%"]);
  });

  it("빈 목록이면 빈 배열이다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { barWidths } = await import("@/shared/utils/rowBars.utils");

    expect(barWidths([])).toEqual([]);
  });
});
