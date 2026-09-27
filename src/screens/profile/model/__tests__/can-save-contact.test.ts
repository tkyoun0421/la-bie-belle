import { canSaveContact } from "@/screens/profile/model/can-save-contact";

// 연락처 시트의 「저장」이 켜지는 조건. 형식 규칙은 `validateProfileForm`(ACC-004)을 그대로
// 쓴다 — 정본은 `docs/2-design/spec/profile-screen.md`의 AC-03이다.

describe("canSaveContact — 010으로 시작하는 11자리이고 지금 번호와 달라야 켜진다", () => {
  it("010으로 시작하지 않으면 저장하지 않는다", () => {
    expect(canSaveContact("01000000001", "01100000002")).toBe(false);
  });

  it("11자리가 안 되면 저장하지 않는다", () => {
    expect(canSaveContact("01000000001", "0100000000")).toBe(false);
  });

  it("지금 번호와 같으면 저장하지 않는다", () => {
    expect(canSaveContact("01000000001", "01000000001")).toBe(false);
  });

  it("형식이 맞고 지금 번호와 다르면 저장한다", () => {
    expect(canSaveContact("01000000001", "01000000009")).toBe(true);
  });
});
