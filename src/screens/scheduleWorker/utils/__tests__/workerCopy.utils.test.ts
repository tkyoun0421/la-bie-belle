const { spellNotOpen, spellSubmitted } =
  await import("@/screens/scheduleWorker/utils/workerCopy.utils");

describe("workerCopy — 값이 들어가야 서는 문구들", () => {
  it("보낸 뒤 토스트가 그 달을 부른다", () => {
    expect(spellSubmitted("2026-10")).toBe("10월 근무 신청을 보냈어요");
  });

  it("한 자리 달은 0을 떼고 부른다", () => {
    expect(spellSubmitted("2026-03")).toBe("3월 근무 신청을 보냈어요");
  });

  it("아직 안 연 달은 열면 알려준다고 말한다", () => {
    expect(spellNotOpen("2026-12")).toBe(
      "아직 12월 근무 신청을 받지 않아요. 열리면 알려드릴게요",
    );
  });
});
