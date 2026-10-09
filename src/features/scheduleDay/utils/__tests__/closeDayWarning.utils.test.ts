const { closeDayWarningLine } =
  await import("@/features/scheduleDay/utils/closeDayWarning.utils");

describe("closeDayWarningLine — 닫으면 같이 사라지는 배정 수를 말한다", () => {
  it("배정 수가 줄에 든다", () => {
    expect(closeDayWarningLine(3)).toBe("배정 3건이 같이 사라져요");
  });

  it("한 건도 그 꼴로 말한다", () => {
    expect(closeDayWarningLine(1)).toBe("배정 1건이 같이 사라져요");
  });
});
