import type { Profile } from "@/entities/profile/model/profile.type";
import { PROFILE_FORM_STEPS } from "@/features/profileEdit/consts/profileEdit.const";
import type { ProfileFormStep } from "@/features/profileEdit/model/profileFormStep.type";
import type { PendingStage } from "@/screens/pending/model/pendingForm.type";

export function firstOpenStep(
  frozen: readonly ProfileFormStep[],
): ProfileFormStep | null {
  return PROFILE_FORM_STEPS.find((step) => !frozen.includes(step)) ?? null;
}

export type StageSource = Pick<Profile, "submittedAt" | "rejectedAt">;

export function stageOfProfile(profile: StageSource | null): PendingStage {
  if (profile?.rejectedAt) {
    return "rejected";
  }

  return profile?.submittedAt ? "waiting" : "form";
}
