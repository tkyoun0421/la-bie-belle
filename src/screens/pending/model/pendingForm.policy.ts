import type { Profile } from "@/entities/profile/model/profile.type";
import type { PendingStage } from "@/screens/pending/model/pendingForm.type";

export type StageSource = Pick<Profile, "submittedAt" | "rejectedAt">;

export function stageOfProfile(profile: StageSource | null): PendingStage {
  if (profile?.rejectedAt) {
    return "rejected";
  }

  return profile?.submittedAt ? "waiting" : "form";
}
