import { RETRY_PATH } from "@/shared/consts/navigation.const";
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

describe("resolveAdminGuard — 데이터 없는 실패는 /retry로 보낸다", () => {
  it("failed가 참이면 프로필이 없어도 홈이 아니라 RETRY_PATH다", () => {
    // @ts-expect-error 대상 인자가 아직 없다
    expect(resolveAdminGuard(null, { failed: true })).toBe(RETRY_PATH);
  });

  it("failed가 거짓이면 지금과 같은 판정이다", () => {
    // @ts-expect-error 대상 인자가 아직 없다
    expect(resolveAdminGuard({ role: "admin" }, { failed: false })).toBeNull();
    // @ts-expect-error 대상 인자가 아직 없다
    expect(resolveAdminGuard(null, { failed: false })).toBe("/");
  });
});
