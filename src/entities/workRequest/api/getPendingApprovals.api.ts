import type { DB } from "@/shared/api/database";
import type { PendingApprovalRow } from "@/entities/workRequest/api/workRequest.dto";
import type { PendingApproval } from "@/entities/workRequest/model/workRequest.type";
import { toPendingApproval } from "@/entities/workRequest/utils/workRequest.mapper";

const APPROVAL_COLUMNS = [
  "id",
  "assignment_id",
  "reason",
  "created_at",
  "assignments!inner(day_id, position, days!inner(work_date, starts_at, ends_at))",
  "profiles!cancel_requests_profile_id_fkey(display_name, photo_url)",
].join(", ");

export async function getPendingApprovals(
  client: DB,
): Promise<PendingApproval[]> {
  const { data, error } = await client
    .from("cancel_requests")
    .select(APPROVAL_COLUMNS)
    .is("decided_at", null)
    .order("created_at")
    .returns<PendingApprovalRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(toPendingApproval);
}
