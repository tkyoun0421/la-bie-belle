import type {
  ActiveMemberRow,
  FilledQualificationRow,
  MemberRow,
  MemberSummaryRow,
} from "@/entities/member/api/member.dto";
import type {
  ActiveMember,
  Member,
  MemberSummary,
  Qualification,
} from "@/entities/member/model/member.type";

export function toQualification(row: FilledQualificationRow): Qualification {
  return { profileId: row.profile_id, position: row.position };
}

export function toMemberSummary(row: MemberSummaryRow): MemberSummary {
  return {
    id: row.id,
    displayName: row.display_name,
    photoUrl: row.photo_url,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    blockedAt: row.blocked_at,
  };
}

export function toMember(row: MemberRow): Member {
  return {
    ...toMemberSummary(row),
    role: row.role,
    leftAt: row.left_at,
    erasedAt: row.erased_at,
    phone: row.profile_private?.phone ?? null,
    birthDate: row.profile_private?.birth_date ?? null,
    gender: row.profile_private?.gender ?? null,
  };
}

export function toActiveMember(
  row: ActiveMemberRow,
  hasDevice: boolean,
): ActiveMember {
  return {
    ...toMember(row),
    notificationsEnabled: row.notifications_enabled,
    hasDevice,
  };
}
