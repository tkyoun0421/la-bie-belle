/**
 * 홀 기본값 질의가 돌려주는 생 꼴이다. `default_slots`는 jsonb 열이라 그 안의 `HallSlot`도
 * DB가 든 꼴이고, `default_starts`·`default_ends`는 `time`이라 `"10:00:00"`으로 온다.
 */

export type HallSlot = {
  positions: string[];
  count: number;
};

export type HallDefaults = {
  default_slots: HallSlot[];
  default_starts: string;
  default_ends: string;
};
