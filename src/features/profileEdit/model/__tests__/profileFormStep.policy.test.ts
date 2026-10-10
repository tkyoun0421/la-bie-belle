import { firstOpenStep } from "@/features/profileEdit/model/profileFormStep.policy";

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
