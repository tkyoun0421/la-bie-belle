import { z } from "zod";

export const AUDIT_EVENT_VALUES = [
  "super_admin_bootstrap",
  "admin_role_granted",
  "admin_role_revoked",
  "signup_approved",
  "signup_rejected",
] as const;

export const AuditEventSchema = z.enum(AUDIT_EVENT_VALUES);
export type AuditEvent = z.infer<typeof AuditEventSchema>;
