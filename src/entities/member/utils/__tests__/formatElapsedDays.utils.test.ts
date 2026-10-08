import { formatElapsedDays } from "@/entities/member/utils/formatElapsedDays.utils";

describe("formatElapsedDays — 보낸 시각과 지금을 KST 달력일로 견줘 얼마나 됐는지를 말한다", () => {
  it("KST로 같은 날이면 UTC 날짜가 갈려도 오늘이다", () => {
    const elapsed = formatElapsedDays(
      "2026-09-24T15:30:00.000Z",
      "2026-09-25T11:00:00.000Z",
    );

    expect(elapsed).toBe("오늘");
  });

  it("KST로 다음 날로 넘어갔으면 UTC 날짜가 같아도 어제다", () => {
    const elapsed = formatElapsedDays(
      "2026-09-24T14:00:00.000Z",
      "2026-09-24T15:30:00.000Z",
    );

    expect(elapsed).toBe("어제");
  });

  it("이틀 이상 지났으면 날 수를 그대로 말한다", () => {
    const elapsed = formatElapsedDays(
      "2026-09-20T12:00:00.000+09:00",
      "2026-09-25T12:00:00.000+09:00",
    );

    expect(elapsed).toBe("5일 전");
  });
});
