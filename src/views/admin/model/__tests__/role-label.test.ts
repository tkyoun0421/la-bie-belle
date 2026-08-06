import { describe, expect, it } from "vitest";

import { roleLabel } from "@/views/admin/model/role-label";

describe("roleLabel", () => {
  it("super_admin이 있으면 슈퍼 관리자다", () => {
    expect(roleLabel(["worker", "admin", "super_admin"])).toBe("슈퍼 관리자");
  });

  it("admin만 있으면 관리자다", () => {
    expect(roleLabel(["worker", "admin"])).toBe("관리자");
  });

  it("worker만 있으면 근무자다", () => {
    expect(roleLabel(["worker"])).toBe("근무자");
  });
});
