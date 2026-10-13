const { homeTileInputOf } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/screens/adminHome/model/homeTileInput.policy"
);

describe("homeTileInputOf — 타일이 말할 달의 상태", () => {
  it("그 달 창이 없으면 아직 안 만든 달이다", () => {
    expect(
      homeTileInputOf({
        month: "2026-11",
        window: null,
        openDays: 3,
        vacancyCount: 2,
      }),
    ).toEqual({ state: "not_created", month: "2026-11" });
  });

  it("창을 아직 못 읽었어도 안 만든 달이다", () => {
    expect(
      homeTileInputOf({
        month: "2026-11",
        window: undefined,
        openDays: 0,
        vacancyCount: 0,
      }),
    ).toEqual({ state: "not_created", month: "2026-11" });
  });

  it("확정된 달은 빈 자리 수만 싣는다", () => {
    expect(
      homeTileInputOf({
        month: "2026-11",
        window: {
          applicationDeadline: null,
          confirmedAt: "2026-10-20T00:00:00.000Z",
        },
        openDays: 3,
        vacancyCount: 2,
      }),
    ).toEqual({ state: "confirmed", month: "2026-11", vacancyCount: 2 });
  });

  it("확정 전인 달은 열린 날과 빈 자리를 싣는다", () => {
    expect(
      homeTileInputOf({
        month: "2026-11",
        window: { applicationDeadline: null, confirmedAt: null },
        openDays: 3,
        vacancyCount: 2,
      }),
    ).toEqual({
      state: "in_progress",
      month: "2026-11",
      openDays: 3,
      vacancyCount: 2,
    });
  });
});
