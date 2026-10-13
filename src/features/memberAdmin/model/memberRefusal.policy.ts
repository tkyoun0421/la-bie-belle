import type { ErrorCode } from "@/shared/model/error.type";
import type { MemberDialogKind } from "@/features/memberAdmin/model/memberAdmin.type";

export function refusalDialogOf(
  leaveCode: ErrorCode | null,
  roleCode: ErrorCode | null,
): MemberDialogKind | null {
  if (leaveCode === "has_future_assignments") {
    return "blocked";
  }

  if (leaveCode === "last_admin" || roleCode === "last_admin") {
    return "last-admin";
  }

  return null;
}
