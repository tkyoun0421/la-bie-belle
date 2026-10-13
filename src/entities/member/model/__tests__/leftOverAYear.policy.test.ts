import { isLeftOverAYear } from "@/entities/member/model/leftOverAYear.policy";

describe("isLeftOverAYear — 퇴사한 지 1년이 지났는지를 판정한다", () => {
  it("퇴사한 지 1년이 채 안 됐으면 거짓이다", () => {
    expect(
      isLeftOverAYear("2025-09-25T00:00:00.000Z", "2026-09-24T00:00:00.000Z"),
    ).toBe(false);
  });

  it("퇴사한 날로부터 정확히 1년째면 참이다", () => {
    expect(
      isLeftOverAYear("2025-09-25T00:00:00.000Z", "2026-09-25T00:00:00.000Z"),
    ).toBe(true);
  });

  it("1년을 넘겼으면 참이다", () => {
    expect(
      isLeftOverAYear("2024-01-01T00:00:00.000Z", "2026-09-25T00:00:00.000Z"),
    ).toBe(true);
  });
});
