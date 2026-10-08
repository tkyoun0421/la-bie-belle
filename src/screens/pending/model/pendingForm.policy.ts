import {
  STEPS,
  type PendingStage,
  type Step,
} from "@/screens/pending/model/pendingForm.type";

export function firstOpenStep(frozen: readonly Step[]): Step | null {
  return STEPS.find((step) => !frozen.includes(step)) ?? null;
}

export type StageSource = {
  submitted_at: string | null;
  rejected_at: string | null;
};

export function stageOfProfile(profile: StageSource | null): PendingStage {
  if (profile?.rejected_at) {
    return "rejected";
  }

  return profile?.submitted_at ? "waiting" : "form";
}
