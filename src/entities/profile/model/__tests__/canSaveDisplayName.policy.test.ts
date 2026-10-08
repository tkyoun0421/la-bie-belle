import { canSaveDisplayName } from "@/entities/profile/model/canSaveDisplayName.policy";

describe("canSaveDisplayName — 빈 칸과 변화 없음을 막는다", () => {
  it("입력이 빈 칸이면 저장할 수 없다", () => {
    expect(canSaveDisplayName("박서연", "")).toBe(false);
  });

  it("입력이 공백뿐이면 저장할 수 없다", () => {
    expect(canSaveDisplayName("박서연", "   ")).toBe(false);
  });

  it("지금 이름 그대로면 저장할 수 없다", () => {
    expect(canSaveDisplayName("박서연", "박서연")).toBe(false);
  });

  it("앞뒤 공백만 다르고 값이 같으면 저장할 수 없다", () => {
    expect(canSaveDisplayName("박서연", "  박서연  ")).toBe(false);
  });

  it("다른 이름이면 저장할 수 있다", () => {
    expect(canSaveDisplayName("박서연", "박서영")).toBe(true);
  });
});
