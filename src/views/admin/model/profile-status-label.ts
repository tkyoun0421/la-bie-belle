import type { ProfileStatus } from "@/entities/identity/model/profile-gate";

const PROFILE_STATUS_LABELS: Record<ProfileStatus, string> = {
  pending: "승인 대기",
  active: "활동 중",
  rejected: "거절됨",
  dormant: "휴면",
  departed: "퇴사",
};

export function profileStatusLabel(status: ProfileStatus): string {
  return PROFILE_STATUS_LABELS[status];
}
