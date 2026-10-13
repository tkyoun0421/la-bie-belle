const { sheetOpenedOn } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/screens/scheduleWorker/model/scheduleWorkerSheet.policy"
);

describe("sheetOpenedOn — 들어올 때 시트가 어떤 모습인지", () => {
  it("날짜 없이 들어오면 시트가 닫혀 있다", () => {
    expect(sheetOpenedOn(undefined)).toEqual({ kind: "closed" });
  });

  it("날짜를 달고 들어오면 그날의 시트가 취소 중이 아닌 채 열려 있다", () => {
    expect(sheetOpenedOn("2026-10-17")).toEqual({
      kind: "open",
      openDate: "2026-10-17",
      cancelling: false,
    });
  });
});
