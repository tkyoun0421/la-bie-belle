import { isValidPhone } from "@/entities/profile/model/profile.schema";

export function canSaveContact(current: string, draft: string): boolean {
  return draft !== current && isValidPhone(draft);
}
