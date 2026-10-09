const { fragmentStateOf } =
  await import("@/features/payrollCompute/model/fragmentState.policy");

describe("fragmentStateOf — 읽은 결과를 상태 이름으로 바꾼다", () => {
  it("값이 왔으면 ready다", () => {
    expect(fragmentStateOf({ data: [], error: null })).toBe("ready");
  });

  it("값이 아직 없으면 pending이다", () => {
    expect(fragmentStateOf({ data: undefined, error: null })).toBe("pending");
  });

  it("오류가 있으면 값이 있어도 failed다", () => {
    expect(fragmentStateOf({ data: [], error: new Error("끊겼다") })).toBe(
      "failed",
    );
  });

  it("오류가 있고 값도 없으면 failed다", () => {
    expect(
      fragmentStateOf({ data: undefined, error: new Error("끊겼다") }),
    ).toBe("failed");
  });
});
