import type {
  PendingApprovalRow,
  SlotRequestCandidateRow,
  SlotRequestRow,
} from "@/entities/workRequest/api/workRequest.dto";
import type {
  PendingApproval,
  SlotRequest,
  SlotRequestCandidate,
} from "@/entities/workRequest/model/workRequest.type";

function toCandidate(row: SlotRequestCandidateRow): SlotRequestCandidate {
  return {
    profileId: row.profile_id,
    status: row.status,
    expiresAt: row.expires_at,
  };
}

export function toSlotRequest(row: SlotRequestRow): SlotRequest {
  return {
    id: row.id,
    slotId: row.slot_id,
    closedAt: row.closed_at,
    expiresAt: row.expires_at,
    candidates: row.request_candidates.map(toCandidate),
    positions: row.slots.positions,
    workDate: row.slots.days.work_date,
    startsAt: row.slots.days.starts_at,
    endsAt: row.slots.days.ends_at,
  };
}

export function toPendingApproval(row: PendingApprovalRow): PendingApproval {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    reason: row.reason,
    createdAt: row.created_at,
    dayId: row.assignments.day_id,
    position: row.assignments.position,
    workDate: row.assignments.days.work_date,
    startsAt: row.assignments.days.starts_at,
    endsAt: row.assignments.days.ends_at,
    name: row.profiles.display_name,
    photoUrl: row.profiles.photo_url,
  };
}
