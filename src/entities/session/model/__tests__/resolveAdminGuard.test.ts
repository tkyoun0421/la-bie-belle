import { resolveAdminGuard } from "@/entities/session/model/resolveAdminGuard";

// `/admin` 아래를 지키는 순수 판정 — [navigation.md 「경로」]의 "근무자가 /admin을
// 열었을 때 /로 보낸다"를 그대로 옮긴다. resolveAuthDestination·resolveGateMove와 같은
// 꼴로, 목적지가 없으면(=지금 자리에 그대로 둔다) null을 돌려준다.

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
