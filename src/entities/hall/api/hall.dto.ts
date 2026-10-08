import type { HallSlot } from "@/entities/hall/model/hall.type";

export type HallDefaultsRow = {
  default_slots: HallSlot[];
  default_starts: string;
  default_ends: string;
};
