import { describe, expect, it } from "vitest";

import { ROLE_VALUES, RoleValueSchema, hasRole } from "@/entities/identity/model/role";

describe("ROLE_VALUES", () => {
  it("worker, admin, super_admin 세 값을 이 순서로 갖는다", () => {
    expect(ROLE_VALUES).toEqual(["worker", "admin", "super_admin"]);
  });
});

describe("RoleValueSchema", () => {
  it("등록된 값을 파싱한다", () => {
    expect(RoleValueSchema.parse("admin")).toBe("admin");
  });

  it("등록되지 않은 값은 거부한다", () => {
    expect(RoleValueSchema.safeParse("owner").success).toBe(false);
  });
});

describe("hasRole", () => {
  it("역할 목록에 해당 역할이 있으면 true다", () => {
    expect(hasRole(["worker", "admin"], "admin")).toBe(true);
  });

  it("역할 목록에 해당 역할이 없으면 false다", () => {
    expect(hasRole(["worker"], "admin")).toBe(false);
  });

  it("빈 역할 목록은 항상 false다", () => {
    expect(hasRole([], "worker")).toBe(false);
  });
});
