import { kstDateOf } from "@/shared/utils/kstDate";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";

export function useServerToday(): string {
  return kstDateOf(new Date(useServerNow()));
}
