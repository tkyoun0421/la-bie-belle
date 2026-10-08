import type { ExcuseRow } from "@/entities/excuse/api/excuse.dto";
import type { Excuse } from "@/entities/excuse/model/excuse.type";

export function toExcuse(row: ExcuseRow): Excuse {
  return {
    id: row.id,
    dayId: row.day_id,
    profileId: row.profile_id,
    body: row.body,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    decision: row.decision,
    decisionReason: row.decision_reason,
  };
}
