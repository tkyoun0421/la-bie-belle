import type { ProfileFormValues } from "@/entities/profile/model/profile.schema";

export const STEPS = ["photo", "name", "gender", "birthDate", "phone"] as const;

export type Step = (typeof STEPS)[number];

export type PendingStage =
  "loading" | "signedOut" | "form" | "celebrating" | "waiting" | "rejected";

export type PendingFormValues = ProfileFormValues;

export const EMPTY_PENDING_FORM: PendingFormValues = {
  name: "",
  gender: null,
  birthDate: "",
  phone: "",
};
