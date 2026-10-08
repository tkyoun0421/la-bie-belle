import type { ProfileFormValues } from "@/entities/profile/model/profile.schema";
import type { PENDING_STEPS } from "@/screens/pending/consts/pending.const";

export type Step = (typeof PENDING_STEPS)[number];

export type PendingStage =
  "loading" | "signedOut" | "form" | "celebrating" | "waiting" | "rejected";

export type PendingFormValues = ProfileFormValues;
