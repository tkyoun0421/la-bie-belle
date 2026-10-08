import { resolveAdminGuard } from "@/entities/session/model/resolveAdminGuard.policy";

describe("resolveAdminGuard — role이 admin이 아니면 홈으로 보낸다", () => {
  it("role이 admin이면 그대로 둔다", () => {
    expect(resolveAdminGuard({ role: "admin" })).toBeNull();
  });

  it("role이 member면 홈으로 보낸다", () => {
    expect(resolveAdminGuard({ role: "member" })).toBe("/");
  });

  it("프로필 행이 아직 없으면(읽는 중이거나 데이터가 없거나) 홈으로 보낸다", () => {
    expect(resolveAdminGuard(null)).toBe("/");
  });
});
