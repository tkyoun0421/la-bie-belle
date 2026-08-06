import type { PendingProfile } from "@/entities/identity/types/pending-profile";
import type { ApprovalActionOutcome } from "@/features/approval/hooks/useApprovalActions";
import { ApprovalActionButtons } from "@/features/approval/ui/ApprovalActionButtons";
import { formatDateTimeInSeoul } from "@/shared/lib/format-date-time-seoul";
import { genderLabel } from "@/views/admin/model/gender-label";

type ApprovalListViewProps = {
  profiles: PendingProfile[];
  onApprove: (targetProfileId: string) => Promise<ApprovalActionOutcome>;
  onReject: (targetProfileId: string, reason?: string) => Promise<ApprovalActionOutcome>;
};

export function ApprovalListView({ profiles, onApprove, onReject }: ApprovalListViewProps) {
  if (profiles.length === 0) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="typo-body text-text">대기 중인 가입 신청이 없어요</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-24">
      <h1 className="typo-display text-text-strong">가입 승인</h1>
      <ul className="flex flex-col">
        {profiles.map((profile) => (
          <li key={profile.id} className="flex flex-col gap-3 border-b border-border py-4">
            <div className="flex flex-col gap-1">
              <span className="typo-body text-text-strong">{profile.name}</span>
              <span className="typo-caption text-text">
                {genderLabel(profile.gender)} · {profile.birthDate} · {profile.phone}
              </span>
              <span className="typo-caption text-text-muted">
                신청 {formatDateTimeInSeoul(profile.createdAt)}
              </span>
            </div>
            <ApprovalActionButtons
              onApprove={onApprove.bind(null, profile.id)}
              onReject={onReject.bind(null, profile.id)}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
