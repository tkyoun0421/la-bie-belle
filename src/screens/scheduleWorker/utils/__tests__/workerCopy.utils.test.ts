const {
  cancelSheetTitle,
  claimedLine,
  requestSubtitle,
  spellNotOpen,
  spellSubmitted,
} = await import("@/screens/scheduleWorker/utils/workerCopy.utils");

const REQUEST = {
  positions: ["안내"],
  workDate: "2026-10-17",
  startsAt: "10:00:00",
  endsAt: "18:00:00",
};

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

  it("요청 시트 부제가 날·포지션·시각 셋을 가운뎃점으로 잇는다", () => {
    expect(requestSubtitle(REQUEST)).toBe(
      "10월 17일(토) · 안내 · 10:00 – 18:00",
    );
  });

  it("포지션이 비어 있어도 부제가 선다", () => {
    expect(
      requestSubtitle({
        ...REQUEST,
        positions: [],
      }),
    ).toBe("10월 17일(토) ·  · 10:00 – 18:00");
  });

  it("늦은 수락 줄은 요일을 안 붙인다", () => {
    expect(claimedLine(REQUEST)).toBe(
      "10월 17일 안내 자리는 다른 분이 맡았어요",
    );
  });

  it("취소 시트 제목이 그 날과 포지션을 든다", () => {
    expect(cancelSheetTitle("2026-10-17", "안내")).toBe(
      "근무 취소 · 10월 17일(토) 안내",
    );
  });
});
