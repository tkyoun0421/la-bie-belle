const { riseTimingOf } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/shared/utils/riseTiming.utils"
);

describe("riseTimingOf — 요소마다 70ms씩 어긋나 300ms 동안 8px 올라온다", () => {
  it("첫 요소는 기다리지 않는다", () => {
    expect(riseTimingOf(0, false)).toEqual({
      delayMs: 0,
      durationMs: 300,
      distance: 8,
    });
  });

  it("네 번째 요소는 210ms 뒤에 시작한다", () => {
    expect(riseTimingOf(3, false)).toEqual({
      delayMs: 210,
      durationMs: 300,
      distance: 8,
    });
  });

  it("다섯 번째 요소는 280ms 뒤에 시작한다", () => {
    expect(riseTimingOf(4, false)).toEqual({
      delayMs: 280,
      durationMs: 300,
      distance: 8,
    });
  });
});

describe("riseTimingOf — 움직임 줄이기는 거리만 0이다", () => {
  it("네 번째 요소의 지연과 시간은 그대로고 거리만 0이다", () => {
    expect(riseTimingOf(3, true)).toEqual({
      delayMs: 210,
      durationMs: 300,
      distance: 0,
    });
  });

  it("다섯 번째 요소의 지연과 시간은 그대로고 거리만 0이다", () => {
    expect(riseTimingOf(4, true)).toEqual({
      delayMs: 280,
      durationMs: 300,
      distance: 0,
    });
  });
});
