import { describe, expect, it } from "vitest";

import { AUDIT_EVENT_VALUES, AuditEventSchema } from "@/entities/identity/model/audit-event";

describe("AuditEventSchema", () => {
  it("기존 5종과 근무자 관리 신규 5종을 모두 허용한다", () => {
    const values = [
      "super_admin_bootstrap",
      "admin_role_granted",
      "admin_role_revoked",
      "signup_approved",
      "signup_rejected",
      "worker_info_updated",
      "hourly_wage_updated",
      "phone_updated",
      "position_granted",
      "position_revoked",
    ];

    for (const value of values) {
      expect(AuditEventSchema.safeParse(value).success).toBe(true);
    }
  });

  it("등록되지 않은 값은 거부한다", () => {
    expect(AuditEventSchema.safeParse("unknown_event").success).toBe(false);
  });

  it("AUDIT_EVENT_VALUES는 정확히 10종이다", () => {
    expect(AUDIT_EVENT_VALUES).toHaveLength(10);
  });
});
