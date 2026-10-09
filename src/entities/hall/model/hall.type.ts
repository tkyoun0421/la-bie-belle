export type HallSlot = {
  positions: string[];
  count: number;
};

export type HallDefaults = {
  slots: HallSlot[];
  starts: string;
  ends: string;
};
