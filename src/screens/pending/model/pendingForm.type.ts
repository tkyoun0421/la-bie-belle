import type { ProfileFormValues } from "@/entities/profile/model/profile.schema";

export type PendingStage =
  "loading" | "signedOut" | "form" | "celebrating" | "waiting" | "rejected";

export type PendingFormValues = ProfileFormValues;
