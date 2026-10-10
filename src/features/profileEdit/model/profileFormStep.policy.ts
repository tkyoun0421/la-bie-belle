import { PROFILE_FORM_STEPS } from "@/features/profileEdit/consts/profileEdit.const";
import type { ProfileFormStep } from "@/features/profileEdit/model/profileFormStep.type";

export function firstOpenStep(
  frozen: readonly ProfileFormStep[],
): ProfileFormStep | null {
  return PROFILE_FORM_STEPS.find((step) => !frozen.includes(step)) ?? null;
}
