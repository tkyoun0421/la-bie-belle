export type HallSlot = {
  positions: string[];
  count: number;
};

export type HallDefaults = {
  default_slots: HallSlot[];
  default_starts: string;
  default_ends: string;
};
