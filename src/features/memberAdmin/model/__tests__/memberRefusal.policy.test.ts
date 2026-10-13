import { refusalDialogOf } from "@/features/memberAdmin/model/memberRefusal.policy";

describe("refusalDialogOf — 거절당한 까닭이 세울 확인창", () => {
  it("퇴사가 앞으로 배정이 남아 거절되면 blocked다", () => {
    expect(refusalDialogOf("has_future_assignments", null)).toBe("blocked");
  });

  it("퇴사가 마지막 관리자라 거절되면 last-admin이다", () => {
    expect(refusalDialogOf("last_admin", null)).toBe("last-admin");
  });

  it("역할 바꾸기가 마지막 관리자라 거절되면 last-admin이다", () => {
    expect(refusalDialogOf(null, "last_admin")).toBe("last-admin");
  });

  it("퇴사가 배정 때문에 거절되면 역할의 마지막 관리자보다 앞선다", () => {
    expect(refusalDialogOf("has_future_assignments", "last_admin")).toBe(
      "blocked",
    );
  });

  it("거절이 없으면 확인창이 없다", () => {
    expect(refusalDialogOf(null, null)).toBeNull();
  });

  it("거절과 상관없는 코드면 확인창이 없다", () => {
    expect(refusalDialogOf("already_decided", "already_done")).toBeNull();
  });
});
