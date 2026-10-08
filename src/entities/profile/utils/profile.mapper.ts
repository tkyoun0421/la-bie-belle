import type {
  MyProfileRow,
  ProfilePrivateRow,
} from "@/entities/profile/api/profile.dto";
import type {
  Profile,
  ProfilePrivate,
} from "@/entities/profile/model/profile.type";

export function toProfile(row: MyProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    photoUrl: row.photo_url,
    role: row.role,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    blockedAt: row.blocked_at,
    leftAt: row.left_at,
    notificationsEnabled: row.notifications_enabled,
  };
}

export function toProfilePrivate(row: ProfilePrivateRow): ProfilePrivate {
  return {
    email: row.email,
    phone: row.phone,
    birthDate: row.birth_date,
    gender: row.gender,
  };
}
