describe("DASH_STROKE_WIDTH — 점선 두께", () => {
  it("1이다", async () => {
    const { DASH_STROKE_WIDTH } = await import(
      // @ts-expect-error 대상 모듈이 아직 없다
      "@/shared/consts/dashedOutline.const"
    );

    expect(DASH_STROKE_WIDTH).toBe(1);
  });
});

describe("dashedRectOf — 선이 칸 안쪽에 떨어지도록 반 두께만큼 들여 그린다", () => {
  it("40x64 칸이면 0.5에서 시작해 39x63을 그린다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { dashedRectOf } = await import("@/shared/utils/dashedOutline.utils");

    expect(dashedRectOf({ width: 40, height: 64 })).toEqual({
      x: 0.5,
      y: 0.5,
      width: 39,
      height: 63,
    });
  });

  it("칸이 두께보다 작으면 폭과 높이가 0이다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { dashedRectOf } = await import("@/shared/utils/dashedOutline.utils");

    expect(dashedRectOf({ width: 0.5, height: 0.5 })).toEqual({
      x: 0.5,
      y: 0.5,
      width: 0,
      height: 0,
    });
  });

  it("칸이 0이면 폭과 높이가 음수로 내려가지 않고 0이다", async () => {
    // @ts-expect-error 대상 모듈이 아직 없다
    const { dashedRectOf } = await import("@/shared/utils/dashedOutline.utils");

    const rect = dashedRectOf({ width: 0, height: 0 });

    expect(rect.width).toBe(0);
    expect(rect.height).toBe(0);
  });
});
