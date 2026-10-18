describe("rootGateOf — 설정 여부로 루트가 그릴 것을 정한다", () => {
  it("설정이 비어 있으면 앱을 열 수 없다는 장을 그린다", async () => {
    const { rootGateOf } = await import(
      // @ts-expect-error 대상 모듈이 아직 없다
      "@/shared/utils/rootGate.utils"
    );

    expect(rootGateOf({ configured: false })).toBe("unavailable");
  });

  it("설정이 채워져 있으면 앱을 그린다", async () => {
    const { rootGateOf } = await import(
      // @ts-expect-error 대상 모듈이 아직 없다
      "@/shared/utils/rootGate.utils"
    );

    expect(rootGateOf({ configured: true })).toBe("app");
  });
});
