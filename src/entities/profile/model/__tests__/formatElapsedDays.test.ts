import { formatElapsedDays } from "@/entities/profile/model/formatElapsedDays";

// 가입 대기·차단 목록의 "보낸 지 얼마나" 줄. KST(UTC+9) 달력일로 오늘·어제·N일 전을 가른다.
// [members-pending.md 「목록 문안」]이 정본이다.

describe("formatElapsedDays — 보낸 시각과 지금을 KST 달력일로 견줘 얼마나 됐는지를 말한다", () => {
  it("KST로 같은 날이면 UTC 날짜가 갈려도 오늘이다", () => {
    // submittedAt: 2026-09-24T15:30:00Z = KST 2026-09-25 00:30
    // now:         2026-09-25T11:00:00Z = KST 2026-09-25 20:00
    // UTC 달력일은 24일·25일로 갈리지만 KST로는 둘 다 25일이다.
    const elapsed = formatElapsedDays(
      "2026-09-24T15:30:00.000Z",
      "2026-09-25T11:00:00.000Z",
    );

    expect(elapsed).toBe("오늘");
  });

  it("KST로 다음 날로 넘어갔으면 UTC 날짜가 같아도 어제다", () => {
    // submittedAt: 2026-09-24T14:00:00Z = KST 2026-09-24 23:00
    // now:         2026-09-24T15:30:00Z = KST 2026-09-25 00:30
    // UTC 달력일은 둘 다 24일이지만 KST 자정을 넘어서 하루 지났다.
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
