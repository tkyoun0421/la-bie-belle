import { stageOfProfile } from "@/screens/pending/model/pendingForm.policy";

describe("stageOfProfile — 시각 둘이 장면을 정한다", () => {
  it("거절이 가장 앞선다", () => {
    expect(
      stageOfProfile({
        submittedAt: "2026-10-01T00:00:00.000Z",
        rejectedAt: "2026-10-02T00:00:00.000Z",
      }),
    ).toBe("rejected");
  });

  it("보냈으면 기다리는 중이다", () => {
    expect(
      stageOfProfile({
        submittedAt: "2026-10-01T00:00:00.000Z",
        rejectedAt: null,
      }),
    ).toBe("waiting");
  });

  it("안 보냈으면 적는 자리다", () => {
    expect(stageOfProfile({ submittedAt: null, rejectedAt: null })).toBe(
      "form",
    );
  });

  it("프로필 행이 아직 없어도 적는 자리다", () => {
    expect(stageOfProfile(null)).toBe("form");
  });
});
