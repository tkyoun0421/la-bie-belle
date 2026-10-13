import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";

export function positionRank(position: string): number {
  const at = POSITION_ORDER.findIndex((known) => known === position);

  return at === -1 ? POSITION_ORDER.length : at;
}
