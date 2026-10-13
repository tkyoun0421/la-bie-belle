import type { HallSlot } from "@/entities/hall/model/hall.type";

export type HallDefaultsInput = {
  slots: HallSlot[];
  starts: string;
  ends: string;
};
