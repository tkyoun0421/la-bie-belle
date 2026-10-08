import {
  firstOpenStep,
  stageOfProfile,
} from "@/screens/pending/model/pendingForm.policy";

describe("firstOpenStep — 아직 안 굳은 첫 칸이다", () => {
  it("아무것도 안 굳었으면 사진부터다", () => {
    expect(firstOpenStep([])).toBe("photo");
  });

  it("앞이 굳으면 다음 칸이다", () => {
    expect(firstOpenStep(["photo", "name"])).toBe("gender");
  });

  it("가운데가 녹으면 그 칸으로 되돌아간다", () => {
    expect(firstOpenStep(["photo", "gender", "birthDate", "phone"])).toBe(
      "name",
    );
  });

  it("다 굳었으면 열린 칸이 없다", () => {
    expect(
      firstOpenStep(["photo", "name", "gender", "birthDate", "phone"]),
    ).toBeNull();
  });
});

describe("stageOfProfile — 시각 둘이 장면을 정한다", () => {
  it("거절이 가장 앞선다", () => {
    expect(
      stageOfProfile({
        submitted_at: "2026-10-01T00:00:00.000Z",
        rejected_at: "2026-10-02T00:00:00.000Z",
      }),
    ).toBe("rejected");
  });

  it("보냈으면 기다리는 중이다", () => {
    expect(
      stageOfProfile({
        submitted_at: "2026-10-01T00:00:00.000Z",
        rejected_at: null,
      }),
    ).toBe("waiting");
  });

  it("안 보냈으면 적는 자리다", () => {
    expect(stageOfProfile({ submitted_at: null, rejected_at: null })).toBe(
      "form",
    );
  });

  it("프로필 행이 아직 없어도 적는 자리다", () => {
    expect(stageOfProfile(null)).toBe("form");
  });
});
