import { canSaveDisplayName } from "@/entities/profile/model/can-save-display-name";

// 이름 고치기 시트의 「저장」 버튼 활성 여부다(`docs/2-design/modules/account/screens/
// members.md`의 「이름 고치기」). 빈 칸이거나 지금 이름 그대로면 저장이 안 눌린다. 같은
// 이름 둘은 막지 않으므로([account/README.md] ACC-009) 중복 검사는 여기서 하지 않는다.

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
