import type { GenderValue } from "@/entities/identity/model/signup";

export type PendingProfile = {
  id: string;
  name: string;
  gender: GenderValue;
  birthDate: string;
  phone: string;
  createdAt: string;
};
