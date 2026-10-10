import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";

export function useServerNow(): number {
  const offset = serverClockStore((at) => at.offset);

  return nowWithOffset(Date.now(), offset);
}
