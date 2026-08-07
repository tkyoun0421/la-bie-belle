import { z } from "zod";

export const AUDIT_EVENT_VALUES = [
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
  "profile_dormanted",
  "profile_reactivated",
] as const;

export const AuditEventSchema = z.enum(AUDIT_EVENT_VALUES);
export type AuditEvent = z.infer<typeof AuditEventSchema>;
