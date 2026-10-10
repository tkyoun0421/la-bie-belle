import { spellDuration } from "@/shared/utils/spellNumber";
import type { RehearsalTotal } from "@/entities/rehearsal/model/rehearsal.type";

export function spellTotal({ count, minutes }: RehearsalTotal): string {
  return count === 0 ? "" : `${count}건 · ${spellDuration(minutes)}`;
}
