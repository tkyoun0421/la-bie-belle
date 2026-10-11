import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";

const RANK_OF = new Map<string, number>(
  POSITION_ORDER.map((position, at): [string, number] => [position, at]),
);

export function positionRank(position: string): number {
  return RANK_OF.get(position) ?? POSITION_ORDER.length;
}
