import {
  spellBlockedLine,
  spellSentLine,
} from "@/entities/member/utils/elapsedLine.utils";

const NOW = "2026-10-03T05:00:00.000Z";

describe("spellSentLine — 날 수가 값인 자리에만 조사가 붙는다", () => {
  it("오늘 보낸 것은 「오늘 보냈어요」다", () => {
    expect(spellSentLine("2026-10-03T01:00:00.000Z", NOW)).toBe(
      "오늘 보냈어요",
    );
  });

  it("지난 것은 「3일 전에 보냈어요」다", () => {
    expect(spellSentLine("2026-09-30T01:00:00.000Z", NOW)).toBe(
      "3일 전에 보냈어요",
    );
  });

  it("보낸 적이 없으면 빈 줄이다", () => {
    expect(spellSentLine(null, NOW)).toBe("");
  });
});

describe("spellBlockedLine — 말만 다르고 꼴이 같다", () => {
  it("오늘 차단한 것은 「오늘 차단했어요」다", () => {
    expect(spellBlockedLine("2026-10-03T01:00:00.000Z", NOW)).toBe(
      "오늘 차단했어요",
    );
  });

  it("지난 것은 「2일 전에 차단했어요」다", () => {
    expect(spellBlockedLine("2026-10-01T01:00:00.000Z", NOW)).toBe(
      "2일 전에 차단했어요",
    );
  });

  it("차단한 때가 없으면 빈 줄이다", () => {
    expect(spellBlockedLine(null, NOW)).toBe("");
  });
});
